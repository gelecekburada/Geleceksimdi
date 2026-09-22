(function () {
  "use strict";

  const VERSION = "1.0.0";

  const DEFAULT_OPTIONS = {
    filename: "baforge-export",
    includeHeaders: true,
    delimiter: ",",
    lineBreak: "\r\n",
    encoding: "utf-8"
  };

  function clone(value) {
    if (value === undefined || value === null) {
      return value;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function normalizeColumns(columns = []) {
    if (!Array.isArray(columns)) {
      return [];
    }

    return columns
      .filter(Boolean)
      .map((column, index) => {
        if (typeof column === "string") {
          return {
            key: column,
            label: column,
            exportable: true,
            order: index
          };
        }

        return {
          key:
            column.key ||
            `column_${index + 1}`,

          label:
            column.label ||
            column.key ||
            `Column ${index + 1}`,

          exportable:
            column.exportable !== false,

          type:
            column.type || "text",

          order: index,

          formatter:
            typeof column.formatter === "function"
              ? column.formatter
              : null
        };
      });
  }

  function normalizeRows(rows = []) {
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((row) => {
      if (
        row &&
        typeof row === "object" &&
        !Array.isArray(row)
      ) {
        return row;
      }

      return {
        value: row
      };
    });
  }

  function getValue(row, key) {
    if (!row || !key) {
      return "";
    }

    return key
      .split(".")
      .reduce((value, part) => {
        if (
          value === undefined ||
          value === null
        ) {
          return "";
        }

        return value[part];
      }, row);
  }

  function valueToString(value) {
    if (
      value === undefined ||
      value === null
    ) {
      return "";
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value
        .map((item) =>
          valueToString(item)
        )
        .join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function escapeCsvValue(
    value,
    delimiter = ","
  ) {
    const stringValue =
      valueToString(value);

    const mustQuote =
      stringValue.includes('"') ||
      stringValue.includes("\n") ||
      stringValue.includes("\r") ||
      stringValue.includes(delimiter);

    if (!mustQuote) {
      return stringValue;
    }

    return `"${stringValue.replace(
      /"/g,
      '""'
    )}"`;
  }

  function prepareExportData(config = {}) {
    const columns =
      normalizeColumns(
        config.columns || []
      ).filter(
        (column) =>
          column.exportable !== false
      );

    const rows =
      normalizeRows(
        config.rows || []
      );

    return {
      columns,
      rows
    };
  }

  function formatCell(
    value,
    column,
    row
  ) {
    if (
      column &&
      typeof column.formatter ===
        "function"
    ) {
      return column.formatter(
        value,
        row
      );
    }

    return value;
  }

  function toMatrix(config = {}) {
    const {
      columns,
      rows
    } = prepareExportData(config);

    const matrix = [];

    if (
      config.includeHeaders !== false
    ) {
      matrix.push(
        columns.map(
          (column) => column.label
        )
      );
    }

    rows.forEach((row) => {
      const values = columns.map(
        (column) => {
          const value =
            getValue(
              row,
              column.key
            );

          return formatCell(
            value,
            column,
            row
          );
        }
      );

      matrix.push(values);
    });

    return matrix;
  }

  function toCsv(config = {}) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...config
    };

    const matrix =
      toMatrix(options);

    return matrix
      .map((row) =>
        row
          .map((value) =>
            escapeCsvValue(
              value,
              options.delimiter
            )
          )
          .join(
            options.delimiter
          )
      )
      .join(
        options.lineBreak
      );
  }

  function toTsv(config = {}) {
    return toCsv({
      ...config,
      delimiter: "\t"
    });
  }

  function toJson(config = {}) {
    const {
      columns,
      rows
    } = prepareExportData(config);

    const includeHeaders =
      config.includeHeaders !== false;

    if (!includeHeaders) {
      return JSON.stringify(
        rows,
        null,
        2
      );
    }

    const output = rows.map(
      (row) => {
        const item = {};

        columns.forEach(
          (column) => {
            const value =
              getValue(
                row,
                column.key
              );

            item[column.key] =
              formatCell(
                value,
                column,
                row
              );
          }
        );

        return item;
      }
    );

    return JSON.stringify(
      output,
      null,
      2
    );
  }

  function escapeHtml(value) {
    return valueToString(value)
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }

  function toHtml(config = {}) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...config
    };

    const {
      columns,
      rows
    } = prepareExportData(
      options
    );

    const headerHtml =
      options.includeHeaders !== false
        ? `
          <thead>
            <tr>
              ${columns
                .map(
                  (column) =>
                    `<th>${escapeHtml(
                      column.label
                    )}</th>`
                )
                .join("")}
            </tr>
          </thead>
        `
        : "";

    const bodyHtml =
      rows.length > 0
        ? rows
            .map((row) => {
              const cells =
                columns
                  .map(
                    (column) => {
                      const value =
                        getValue(
                          row,
                          column.key
                        );

                      const formatted =
                        formatCell(
                          value,
                          column,
                          row
                        );

                      return `<td>${escapeHtml(
                        formatted
                      )}</td>`;
                    }
                  )
                  .join("");

              return `<tr>${cells}</tr>`;
            })
            .join("")
        : `
          <tr>
            <td colspan="${Math.max(
              columns.length,
              1
            )}">
              No data available.
            </td>
          </tr>
        `;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(
    options.filename
  )}</title>
  <style>
    body {
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      margin: 24px;
      color: #111827;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      font-weight: 600;
    }
  </style>
</head>
<body>
  <table>
    ${headerHtml}
    <tbody>
      ${bodyHtml}
    </tbody>
  </table>
</body>
</html>`;
  }

  function createBlob(
    content,
    mimeType = "text/plain;charset=utf-8"
  ) {
    return new Blob(
      [content],
      {
        type: mimeType
      }
    );
  }

  function downloadBlob(
    blob,
    filename
  ) {
    if (
      typeof document ===
        "undefined"
    ) {
      return false;
    }

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      filename || "download";

    link.style.display =
      "none";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    setTimeout(() => {
      URL.revokeObjectURL(
        url
      );
    }, 1000);

    return true;
  }

  function normalizeFilename(
    filename,
    extension
  ) {
    const base =
      String(
        filename ||
          "baforge-export"
      )
        .trim()
        .replace(
          /[<>:"/\\|?*\x00-\x1F]/g,
          "_"
        );

    const cleanExtension =
      String(
        extension || ""
      )
        .replace(
          /^\./,
          ""
        )
        .trim();

    if (!cleanExtension) {
      return base;
    }

    const suffix =
      `.${cleanExtension}`;

    if (
      base
        .toLowerCase()
        .endsWith(
          suffix.toLowerCase()
        )
    ) {
      return base;
    }

    return `${base}${suffix}`;
  }

  function exportCsv(
    config = {}
  ) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...config
    };

    const content =
      toCsv(options);

    const filename =
      normalizeFilename(
        options.filename,
        "csv"
      );

    const blob =
      createBlob(
        content,
        "text/csv;charset=utf-8"
      );

    return {
      content,
      blob,
      filename,
      download: () =>
        downloadBlob(
          blob,
          filename
        )
    };
  }

  function exportTsv(
    config = {}
  ) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...config
    };

    const content =
      toTsv(options);

    const filename =
      normalizeFilename(
        options.filename,
        "tsv"
      );

    const blob =
      createBlob(
        content,
        "text/tab-separated-values;charset=utf-8"
      );

    return {
      content,
      blob,
      filename,
      download: () =>
        downloadBlob(
          blob,
          filename
        )
    };
  }

  function exportJson(
    config = {}
  ) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...config
    };

    const content =
      toJson(options);

    const filename =
      normalizeFilename(
        options.filename,
        "json"
      );

    const blob =
      createBlob(
        content,
        "application/json;charset=utf-8"
      );

    return {
      content,
      blob,
      filename,
      download: () =>
        downloadBlob(
          blob,
          filename
        )
    };
  }

  function exportHtml(
    config = {}
  ) {
    const options = {
      ...DEFAULT_OPTIONS,
      ...config
    };

    const content =
      toHtml(options);

    const filename =
      normalizeFilename(
        options.filename,
        "html"
      );

    const blob =
      createBlob(
        content,
        "text/html;charset=utf-8"
      );

    return {
      content,
      blob,
      filename,
      download: () =>
        downloadBlob(
          blob,
          filename
        )
    };
  }

  function getSupportedFormats() {
    return [
      {
        id: "csv",
        label: "CSV",
        extension: "csv",
        mimeType:
          "text/csv"
      },
      {
        id: "tsv",
        label: "TSV",
        extension: "tsv",
        mimeType:
          "text/tab-separated-values"
      },
      {
        id: "json",
        label: "JSON",
        extension: "json",
        mimeType:
          "application/json"
      },
      {
        id: "html",
        label: "HTML",
        extension: "html",
        mimeType:
          "text/html"
      },
      {
        id: "xlsx",
        label: "Excel",
        extension: "xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        adapterRequired: true
      },
      {
        id: "docx",
        label: "Word",
        extension: "docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        adapterRequired: true
      },
      {
        id: "pdf",
        label: "PDF",
        extension: "pdf",
        mimeType:
          "application/pdf",
        adapterRequired: true
      }
    ];
  }

  const adapters = {};

  function registerAdapter(
    format,
    adapter
  ) {
    if (
      !format ||
      typeof adapter !==
        "function"
    ) {
      throw new Error(
        "A valid format and adapter function are required."
      );
    }

    adapters[
      format.toLowerCase()
    ] = adapter;

    return true;
  }

  async function exportData(
    format,
    config = {}
  ) {
    const normalizedFormat =
      String(
        format || ""
      ).toLowerCase();

    switch (
      normalizedFormat
    ) {
      case "csv":
        return exportCsv(
          config
        );

      case "tsv":
        return exportTsv(
          config
        );

      case "json":
        return exportJson(
          config
        );

      case "html":
        return exportHtml(
          config
        );

      default: {
        const adapter =
          adapters[
            normalizedFormat
          ];

        if (!adapter) {
          throw new Error(
            `No export adapter registered for format: ${normalizedFormat}`
          );
        }

        return adapter(
          config
        );
      }
    }
  }

  window.BAExportEngine = {
    VERSION,

    clone,

    normalizeColumns,
    normalizeRows,

    getValue,
    valueToString,

    prepareExportData,
    toMatrix,

    toCsv,
    toTsv,
    toJson,
    toHtml,

    createBlob,
    downloadBlob,

    normalizeFilename,

    exportCsv,
    exportTsv,
    exportJson,
    exportHtml,

    exportData,

    getSupportedFormats,

    registerAdapter
  };
})();