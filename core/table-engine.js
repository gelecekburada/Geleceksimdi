(function () {
  "use strict";

  const VERSION = "1.0.0";

  const DEFAULT_OPTIONS = {
    searchable: true,
    sortable: true,
    filterable: true,
    selectable: true,
    columnVisibility: true,
    pagination: false,
    pageSize: 25,
    emptyMessage: "No data available.",
    searchPlaceholder: "Search..."
  };

  function createId(prefix = "table") {
    return `${prefix}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  function clone(value) {
    if (value === undefined || value === null) {
      return value;
    }

    return JSON.parse(JSON.stringify(value));
  }

  function normalizeColumn(column, index) {
    if (typeof column === "string") {
      return {
        key: column,
        label: column,
        type: "text",
        sortable: true,
        filterable: true,
        visible: true,
        order: index
      };
    }

    return {
      key: column.key || `column_${index}`,
      label: column.label || column.key || `Column ${index + 1}`,
      type: column.type || "text",

      sortable:
        column.sortable !== undefined
          ? column.sortable
          : true,

      filterable:
        column.filterable !== undefined
          ? column.filterable
          : true,

      visible:
        column.visible !== undefined
          ? column.visible
          : true,

      exportable:
        column.exportable !== undefined
          ? column.exportable
          : true,

      width: column.width || null,

      align: column.align || "left",

      formatter:
        typeof column.formatter === "function"
          ? column.formatter
          : null,

      order: index
    };
  }

  function normalizeColumns(columns = []) {
    return columns.map(normalizeColumn);
  }

  function normalizeRows(rows = []) {
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((row, index) => {
      if (
        row &&
        typeof row === "object" &&
        !Array.isArray(row)
      ) {
        return {
          ...row,
          __tableRowId:
            row.__tableRowId ||
            row.id ||
            `row_${index + 1}`
        };
      }

      return {
        value: row,
        __tableRowId: `row_${index + 1}`
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
        if (value === undefined || value === null) {
          return "";
        }

        return value[part];
      }, row);
  }

  function setValue(row, key, value) {
    if (!row || !key) {
      return row;
    }

    const parts = key.split(".");
    const lastPart = parts.pop();

    let target = row;

    parts.forEach((part) => {
      if (
        !target[part] ||
        typeof target[part] !== "object"
      ) {
        target[part] = {};
      }

      target = target[part];
    });

    target[lastPart] = value;

    return row;
  }

  function valueToString(value) {
    if (value === null || value === undefined) {
      return "";
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => valueToString(item))
        .join(", ");
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }

  function normalizeSearchValue(value) {
    return valueToString(value)
      .toLocaleLowerCase()
      .trim();
  }

  function compareValues(a, b, type = "text") {
    if (a === b) {
      return 0;
    }

    if (a === null || a === undefined || a === "") {
      return -1;
    }

    if (b === null || b === undefined || b === "") {
      return 1;
    }

    if (type === "number") {
      const numberA = Number(a);
      const numberB = Number(b);

      if (!Number.isNaN(numberA) && !Number.isNaN(numberB)) {
        return numberA - numberB;
      }
    }

    if (type === "date" || type === "datetime") {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();

      if (!Number.isNaN(dateA) && !Number.isNaN(dateB)) {
        return dateA - dateB;
      }
    }

    return String(a).localeCompare(
      String(b),
      undefined,
      {
        numeric: true,
        sensitivity: "base"
      }
    );
  }

  function matchesSearch(row, searchTerm, columns) {
    if (!searchTerm) {
      return true;
    }

    const normalizedTerm =
      normalizeSearchValue(searchTerm);

    return columns.some((column) => {
      if (!column.visible && !column.searchable) {
        return false;
      }

      const value = getValue(row, column.key);

      return normalizeSearchValue(value).includes(
        normalizedTerm
      );
    });
  }

  function matchesFilters(row, filters, columns) {
    if (!filters || typeof filters !== "object") {
      return true;
    }

    return Object.entries(filters).every(
      ([key, filter]) => {
        if (
          filter === undefined ||
          filter === null ||
          filter === ""
        ) {
          return true;
        }

        const column = columns.find(
          (item) => item.key === key
        );

        if (!column) {
          return true;
        }

        const value = getValue(row, key);

        if (typeof filter === "function") {
          return filter(value, row);
        }

        if (
          Array.isArray(filter)
        ) {
          return filter.some(
            (item) =>
              normalizeSearchValue(value) ===
              normalizeSearchValue(item)
          );
        }

        if (
          typeof filter === "object"
        ) {
          if (
            filter.operator === "contains"
          ) {
            return normalizeSearchValue(value).includes(
              normalizeSearchValue(filter.value)
            );
          }

          if (
            filter.operator === "equals"
          ) {
            return normalizeSearchValue(value) ===
              normalizeSearchValue(filter.value);
          }

          if (
            filter.operator === "notEquals"
          ) {
            return normalizeSearchValue(value) !==
              normalizeSearchValue(filter.value);
          }

          if (
            filter.operator === "gt"
          ) {
            return compareValues(
              value,
              filter.value,
              column.type
            ) > 0;
          }

          if (
            filter.operator === "gte"
          ) {
            return compareValues(
              value,
              filter.value,
              column.type
            ) >= 0;
          }

          if (
            filter.operator === "lt"
          ) {
            return compareValues(
              value,
              filter.value,
              column.type
            ) < 0;
          }

          if (
            filter.operator === "lte"
          ) {
            return compareValues(
              value,
              filter.value,
              column.type
            ) <= 0;
          }
        }

        return normalizeSearchValue(value).includes(
          normalizeSearchValue(filter)
        );
      }
    );
  }

  function sortRows(rows, sort, columns) {
    if (
      !sort ||
      !sort.key ||
      !Array.isArray(rows)
    ) {
      return rows;
    }

    const column = columns.find(
      (item) => item.key === sort.key
    );

    if (!column || column.sortable === false) {
      return rows;
    }

    const direction =
      sort.direction === "desc"
        ? -1
        : 1;

    return [...rows].sort((rowA, rowB) => {
      const valueA = getValue(rowA, sort.key);
      const valueB = getValue(rowB, sort.key);

      return (
        compareValues(
          valueA,
          valueB,
          column.type
        ) * direction
      );
    });
  }

  function paginateRows(rows, page, pageSize) {
    if (!pageSize || pageSize <= 0) {
      return {
        rows,
        page: 1,
        pageCount: 1,
        totalRows: rows.length
      };
    }

    const safePage = Math.max(
      1,
      Number(page) || 1
    );

    const pageCount = Math.max(
      1,
      Math.ceil(rows.length / pageSize)
    );

    const currentPage = Math.min(
      safePage,
      pageCount
    );

    const start =
      (currentPage - 1) * pageSize;

    return {
      rows: rows.slice(
        start,
        start + pageSize
      ),
      page: currentPage,
      pageCount,
      totalRows: rows.length
    };
  }

  function createTableState(options = {}) {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    return {
      id:
        options.id ||
        createId("table"),

      search: "",

      filters: {},

      sort: {
        key: null,
        direction: "asc"
      },

      visibleColumns: {},

      selectedRows: [],

      page: 1,

      pageSize:
        mergedOptions.pageSize,

      options: mergedOptions
    };
  }

  function createTable(config = {}) {
    const columns = normalizeColumns(
      config.columns || []
    );

    const rows = normalizeRows(
      config.rows || []
    );

    const state = createTableState(
      config.options || {}
    );

    columns.forEach((column) => {
      state.visibleColumns[column.key] =
        column.visible !== false;
    });

    function getVisibleColumns() {
      return columns.filter(
        (column) =>
          state.visibleColumns[column.key] !== false
      );
    }

    function getProcessedRows() {
      let result = [...rows];

      result = result.filter((row) =>
        matchesSearch(
          row,
          state.search,
          columns
        )
      );

      result = result.filter((row) =>
        matchesFilters(
          row,
          state.filters,
          columns
        )
      );

      result = sortRows(
        result,
        state.sort,
        columns
      );

      return result;
    }

    function getPaginatedResult() {
      const processedRows =
        getProcessedRows();

      if (!state.options.pagination) {
        return {
          rows: processedRows,
          page: 1,
          pageCount: 1,
          totalRows: processedRows.length
        };
      }

      return paginateRows(
        processedRows,
        state.page,
        state.pageSize
      );
    }

    function setSearch(value) {
      state.search = value || "";
      state.page = 1;
      return api;
    }

    function setFilter(key, filter) {
      if (
        filter === undefined ||
        filter === null ||
        filter === ""
      ) {
        delete state.filters[key];
      } else {
        state.filters[key] = filter;
      }

      state.page = 1;

      return api;
    }

    function setFilters(filters = {}) {
      state.filters = {
        ...filters
      };

      state.page = 1;

      return api;
    }

    function clearFilters() {
      state.filters = {};
      state.search = "";
      state.page = 1;

      return api;
    }

    function setSort(key, direction) {
      if (!key) {
        state.sort = {
          key: null,
          direction: "asc"
        };

        return api;
      }

      let nextDirection =
        direction || "asc";

      if (!direction) {
        if (state.sort.key === key) {
          nextDirection =
            state.sort.direction === "asc"
              ? "desc"
              : "asc";
        }
      }

      state.sort = {
        key,
        direction: nextDirection
      };

      state.page = 1;

      return api;
    }

    function toggleColumn(key) {
      if (
        state.visibleColumns[key] === undefined
      ) {
        state.visibleColumns[key] = true;
      }

      state.visibleColumns[key] =
        !state.visibleColumns[key];

      return api;
    }

    function setColumnVisibility(
      key,
      visible
    ) {
      state.visibleColumns[key] =
        Boolean(visible);

      return api;
    }

    function setVisibleColumns(keys = []) {
      const keySet = new Set(keys);

      columns.forEach((column) => {
        state.visibleColumns[column.key] =
          keySet.has(column.key);
      });

      return api;
    }

    function resetColumns() {
      columns.forEach((column) => {
        state.visibleColumns[column.key] =
          column.visible !== false;
      });

      return api;
    }

    function selectRow(rowId) {
      if (!state.selectedRows.includes(rowId)) {
        state.selectedRows.push(rowId);
      }

      return api;
    }

    function deselectRow(rowId) {
      state.selectedRows =
        state.selectedRows.filter(
          (id) => id !== rowId
        );

      return api;
    }

    function toggleRowSelection(rowId) {
      if (
        state.selectedRows.includes(rowId)
      ) {
        deselectRow(rowId);
      } else {
        selectRow(rowId);
      }

      return api;
    }

    function selectAll() {
      const processedRows =
        getProcessedRows();

      state.selectedRows =
        processedRows.map(
          (row) => row.__tableRowId
        );

      return api;
    }

    function clearSelection() {
      state.selectedRows = [];

      return api;
    }

    function getSelectedRows() {
      const selected =
        new Set(state.selectedRows);

      return rows.filter((row) =>
        selected.has(row.__tableRowId)
      );
    }

    function setPage(page) {
      state.page = Math.max(
        1,
        Number(page) || 1
      );

      return api;
    }

    function nextPage() {
      const result =
        getPaginatedResult();

      if (state.page < result.pageCount) {
        state.page += 1;
      }

      return api;
    }

    function previousPage() {
      if (state.page > 1) {
        state.page -= 1;
      }

      return api;
    }

    function addRow(row) {
      const normalized =
        normalizeRows([row])[0];

      rows.push(normalized);

      return api;
    }

    function addRows(newRows = []) {
      normalizeRows(newRows).forEach(
        (row) => rows.push(row)
      );

      return api;
    }

    function updateRow(rowId, updates = {}) {
      const index = rows.findIndex(
        (row) =>
          row.__tableRowId === rowId ||
          row.id === rowId
      );

      if (index === -1) {
        return api;
      }

      rows[index] = {
        ...rows[index],
        ...updates,
        __tableRowId:
          rows[index].__tableRowId
      };

      return api;
    }

    function removeRow(rowId) {
      const index = rows.findIndex(
        (row) =>
          row.__tableRowId === rowId ||
          row.id === rowId
      );

      if (index !== -1) {
        rows.splice(index, 1);
      }

      state.selectedRows =
        state.selectedRows.filter(
          (id) => id !== rowId
        );

      return api;
    }

    function replaceRows(newRows = []) {
      rows.length = 0;

      normalizeRows(newRows).forEach(
        (row) => rows.push(row)
      );

      state.selectedRows = [];
      state.page = 1;

      return api;
    }

    function getColumns() {
      return clone(columns);
    }

    function getRows() {
      return clone(rows);
    }

    function getState() {
      return clone(state);
    }

    function getData() {
      const result =
        getPaginatedResult();

      return {
        columns: clone(
          getVisibleColumns()
        ),
        rows: clone(result.rows),

        allRows: clone(
          getProcessedRows()
        ),

        selectedRows: clone(
          getSelectedRows()
        ),

        state: getState(),

        pagination: {
          page: result.page,
          pageCount: result.pageCount,
          totalRows: result.totalRows,
          pageSize: state.pageSize
        }
      };
    }

    function getExportData(options = {}) {
      const exportSelectedOnly =
        options.selectedOnly === true;

      const sourceRows =
        exportSelectedOnly
          ? getSelectedRows()
          : getProcessedRows();

      const exportColumns =
        options.columns ||
        getVisibleColumns().filter(
          (column) =>
            column.exportable !== false
        );

      return {
        columns: clone(exportColumns),
        rows: clone(sourceRows)
      };
    }

    function render(
      container,
      renderOptions = {}
    ) {
      if (!container) {
        return null;
      }

      const data =
        getPaginatedResult();

      const visibleColumns =
        getVisibleColumns();

      const documentRef =
        container.ownerDocument ||
        document;

      container.innerHTML = "";

      if (data.rows.length === 0) {
        const emptyState =
          documentRef.createElement("div");

        emptyState.className =
          renderOptions.emptyClass ||
          "baforge-table-empty";

        emptyState.textContent =
          renderOptions.emptyMessage ||
          state.options.emptyMessage;

        container.appendChild(
          emptyState
        );

        return container;
      }

      const table =
        documentRef.createElement("table");

      table.className =
        renderOptions.tableClass ||
        "baforge-table";

      const thead =
        documentRef.createElement("thead");

      const headerRow =
        documentRef.createElement("tr");

      if (state.options.selectable) {
        const selectHeader =
          documentRef.createElement("th");

        selectHeader.className =
          "baforge-table-select";

        headerRow.appendChild(
          selectHeader
        );
      }

      visibleColumns.forEach(
        (column) => {
          const th =
            documentRef.createElement("th");

          th.dataset.column =
            column.key;

          th.textContent =
            column.label;

          if (column.width) {
            th.style.width =
              column.width;
          }

          if (column.align) {
            th.style.textAlign =
              column.align;
          }

          if (
            state.options.sortable &&
            column.sortable !== false
          ) {
            th.style.cursor = "pointer";

            th.addEventListener(
              "click",
              () => {
                setSort(column.key);

                render(
                  container,
                  renderOptions
                );
              }
            );
          }

          headerRow.appendChild(th);
        }
      );

      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody =
        documentRef.createElement("tbody");

      data.rows.forEach((row) => {
        const tr =
          documentRef.createElement("tr");

        tr.dataset.rowId =
          row.__tableRowId;

        if (state.options.selectable) {
          const selectCell =
            documentRef.createElement("td");

          const checkbox =
            documentRef.createElement(
              "input"
            );

          checkbox.type = "checkbox";

          checkbox.checked =
            state.selectedRows.includes(
              row.__tableRowId
            );

          checkbox.addEventListener(
            "change",
            () => {
              toggleRowSelection(
                row.__tableRowId
              );
            }
          );

          selectCell.appendChild(
            checkbox
          );

          tr.appendChild(selectCell);
        }

        visibleColumns.forEach(
          (column) => {
            const td =
              documentRef.createElement("td");

            let value =
              getValue(
                row,
                column.key
              );

            if (column.formatter) {
              value =
                column.formatter(
                  value,
                  row
                );
            }

            td.textContent =
              valueToString(value);

            if (column.align) {
              td.style.textAlign =
                column.align;
            }

            tr.appendChild(td);
          }
        );

        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      container.appendChild(table);

      if (
        state.options.pagination &&
        data.pageCount > 1
      ) {
        const pagination =
          documentRef.createElement(
            "div"
          );

        pagination.className =
          renderOptions.paginationClass ||
          "baforge-table-pagination";

        const previousButton =
          documentRef.createElement(
            "button"
          );

        previousButton.type = "button";
        previousButton.textContent =
          "Previous";
        previousButton.disabled =
          data.page <= 1;

        previousButton.addEventListener(
          "click",
          () => {
            previousPage();
            render(
              container,
              renderOptions
            );
          }
        );

        const pageInfo =
          documentRef.createElement(
            "span"
          );

        pageInfo.textContent =
          `Page ${data.page} of ${data.pageCount}`;

        const nextButton =
          documentRef.createElement(
            "button"
          );

        nextButton.type = "button";
        nextButton.textContent =
          "Next";
        nextButton.disabled =
          data.page >= data.pageCount;

        nextButton.addEventListener(
          "click",
          () => {
            nextPage();
            render(
              container,
              renderOptions
            );
          }
        );

        pagination.appendChild(
          previousButton
        );

        pagination.appendChild(
          pageInfo
        );

        pagination.appendChild(
          nextButton
        );

        container.appendChild(
          pagination
        );
      }

      return container;
    }

    const api = {
      VERSION,

      getColumns,
      getRows,
      getState,
      getData,
      getExportData,

      getVisibleColumns,
      getProcessedRows,
      getPaginatedResult,

      setSearch,
      setFilter,
      setFilters,
      clearFilters,

      setSort,

      toggleColumn,
      setColumnVisibility,
      setVisibleColumns,
      resetColumns,

      selectRow,
      deselectRow,
      toggleRowSelection,
      selectAll,
      clearSelection,
      getSelectedRows,

      setPage,
      nextPage,
      previousPage,

      addRow,
      addRows,
      updateRow,
      removeRow,
      replaceRows,

      render
    };

    return api;
  }

  window.BATableEngine = {
    VERSION,

    createId,
    normalizeColumn,
    normalizeColumns,
    normalizeRows,

    getValue,
    setValue,
    valueToString,

    compareValues,

    createTableState,
    createTable
  };
})();