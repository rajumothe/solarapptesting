import React, { useState, useCallback, useEffect } from 'react';
import api from '../api';

/**
 * Search Component with debouncing
 * Features:
 * - Real-time search
 * - Debounced API calls
 * - Search suggestions
 * - Multiple search fields
 */
export const SearchComponent = ({
  placeholder = 'Search...',
  onSearch,
  searchFields = ['name', 'email', 'phone'],
  debounceTime = 300,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.length > 2) {
        handleSearch(searchTerm);
      } else {
        setSuggestions([]);
      }
    }, debounceTime);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = useCallback(async (term) => {
    try {
      setLoading(true);
      const response = await api.get('/api/search', {
        params: {
          q: term,
          fields: searchFields.join(','),
        },
      });
      setSuggestions(response.data.results || []);
      setIsOpen(true);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [searchFields]);

  const handleSelect = (item) => {
    setSearchTerm(item.name || item.email || '');
    setIsOpen(false);
    onSearch?.(item);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        className="search-input"
      />

      {loading && <span className="search-loading">🔍 Searching...</span>}

      {isOpen && suggestions.length > 0 && (
        <div className="search-suggestions">
          {suggestions.map((item, idx) => (
            <div
              key={idx}
              className="suggestion-item"
              onClick={() => handleSelect(item)}
            >
              <div className="suggestion-name">{item.name || item.email}</div>
              <div className="suggestion-subtitle">
                {item.phoneNumber || item.status || item.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Filter Component
 * Features:
 * - Multiple filter criteria
 * - Date range filtering
 * - Status filtering
 * - Custom filter fields
 */
export const FilterComponent = ({
  onFilter,
  filters = {},
  filterConfig = [],
}) => {
  const [activeFilters, setActiveFilters] = useState(filters);

  const handleFilterChange = useCallback((filterName, value) => {
    setActiveFilters((prev) => {
      const updated = { ...prev, [filterName]: value };
      onFilter?.(updated);
      return updated;
    });
  }, [onFilter]);

  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    onFilter?.({});
  }, [onFilter]);

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filters</h3>
        <button onClick={handleClearFilters} className="btn-clear">
          Clear All
        </button>
      </div>

      <div className="filter-items">
        {filterConfig.map((config) => (
          <div key={config.name} className="filter-item">
            <label>{config.label}</label>

            {config.type === 'select' ? (
              <select
                value={activeFilters[config.name] || ''}
                onChange={(e) => handleFilterChange(config.name, e.target.value)}
              >
                <option value="">All</option>
                {config.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : config.type === 'dateRange' ? (
              <div className="date-range">
                <input
                  type="date"
                  value={activeFilters[`${config.name}_from`] || ''}
                  onChange={(e) =>
                    handleFilterChange(`${config.name}_from`, e.target.value)
                  }
                  placeholder="From"
                />
                <input
                  type="date"
                  value={activeFilters[`${config.name}_to`] || ''}
                  onChange={(e) =>
                    handleFilterChange(`${config.name}_to`, e.target.value)
                  }
                  placeholder="To"
                />
              </div>
            ) : config.type === 'checkbox' ? (
              <div className="checkbox-group">
                {config.options?.map((opt) => (
                  <label key={opt.value}>
                    <input
                      type="checkbox"
                      checked={
                        activeFilters[config.name]?.includes(opt.value) || false
                      }
                      onChange={(e) => {
                        const current = activeFilters[config.name] || [];
                        const updated = e.target.checked
                          ? [...current, opt.value]
                          : current.filter((v) => v !== opt.value);
                        handleFilterChange(config.name, updated);
                      }}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            ) : (
              <input
                type={config.type || 'text'}
                value={activeFilters[config.name] || ''}
                onChange={(e) =>
                  handleFilterChange(config.name, e.target.value)
                }
                placeholder={config.placeholder}
              />
            )}
          </div>
        ))}
      </div>

      {Object.keys(activeFilters).length > 0 && (
        <div className="active-filters">
          {Object.entries(activeFilters).map(([key, value]) => (
            <span key={key} className="filter-tag">
              {key}: {value}
              <button
                onClick={() =>
                  handleFilterChange(
                    key,
                    undefined
                  )
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Pagination Component
 */
export const Pagination = ({
  currentPage = 1,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems,
}) => {
  const pages = [];
  const maxPagesToShow = 5;
  const halfPages = Math.floor(maxPagesToShow / 2);

  let startPage = Math.max(1, currentPage - halfPages);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="btn-pagination"
        >
          ⏮ First
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-pagination"
        >
          ◀ Previous
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="btn-pagination"
            >
              1
            </button>
            {startPage > 2 && <span className="pagination-dots">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`btn-pagination ${
              page === currentPage ? 'active' : ''
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="pagination-dots">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="btn-pagination"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-pagination"
        >
          Next ▶
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="btn-pagination"
        >
          Last ⏭
        </button>
      </div>
    </div>
  );
};

/**
 * Data Table with Sorting, Filtering, and Pagination
 */
export const DataTable = ({
  data = [],
  columns = [],
  onRowClick,
  loading = false,
  sortable = true,
  searchable = true,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter data
  const filteredData = searchable
    ? data.filter((row) =>
        Object.values(row).some(
          (val) =>
            val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Sort data
  const sortedData = sortable
    ? [...filteredData].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const comparison = aVal > bVal ? 1 : -1;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      })
    : filteredData;

  // Paginate data
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  if (loading) {
    return <div className="data-table-loading">Loading data...</div>;
  }

  return (
    <div className="data-table-container">
      {searchable && (
        <div className="data-table-search">
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>
      )}

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => sortable && handleSort(col.key)}
                  className={sortable ? 'sortable' : ''}
                >
                  {col.label}
                  {sortable && sortConfig.key === col.key && (
                    <span>{sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => onRowClick?.(row)}
                className="data-row"
              >
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paginatedData.length === 0 && (
        <div className="table-empty">No data found</div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(sortedData.length / itemsPerPage)}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        totalItems={sortedData.length}
      />
    </div>
  );
};

export default SearchComponent;
