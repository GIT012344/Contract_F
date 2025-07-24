// Search and filter utilities for Contract Manager

// Advanced search function
export const searchContracts = (contracts, searchTerm, filters = {}) => {
  if (!contracts || contracts.length === 0) return [];
  
  let filtered = [...contracts];
  
  // Text search across multiple fields
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(contract => {
      const searchableFields = [
        contract.contract_no,
        contract.contact_name,
        contract.department,
        contract.status,
        contract.remark1,
        contract.remark2,
        contract.remark3,
        contract.remark4
      ];
      
      return searchableFields.some(field => 
        field && field.toString().toLowerCase().includes(term)
      );
    });
  }
  
  // Status filter
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(contract => contract.status === filters.status);
  }
  
  // Department filter
  if (filters.department && filters.department !== 'all') {
    filtered = filtered.filter(contract => contract.department === filters.department);
  }
  
  // Date range filter
  if (filters.dateFrom) {
    filtered = filtered.filter(contract => {
      const contractDate = new Date(contract.created_at);
      const fromDate = new Date(filters.dateFrom);
      return contractDate >= fromDate;
    });
  }
  
  if (filters.dateTo) {
    filtered = filtered.filter(contract => {
      const contractDate = new Date(contract.created_at);
      const toDate = new Date(filters.dateTo);
      return contractDate <= toDate;
    });
  }
  
  // Period count filter
  if (filters.minPeriods) {
    filtered = filtered.filter(contract => 
      (contract.period_count || 0) >= parseInt(filters.minPeriods)
    );
  }
  
  if (filters.maxPeriods) {
    filtered = filtered.filter(contract => 
      (contract.period_count || 0) <= parseInt(filters.maxPeriods)
    );
  }
  
  return filtered;
};

// Get unique values for filter options
export const getFilterOptions = (contracts) => {
  if (!contracts || contracts.length === 0) {
    return {
      statuses: [],
      departments: []
    };
  }
  
  const statuses = [...new Set(contracts.map(c => c.status).filter(Boolean))];
  const departments = [...new Set(contracts.map(c => c.department).filter(Boolean))];
  
  return {
    statuses: statuses.sort(),
    departments: departments.sort()
  };
};

// Sort contracts
export const sortContracts = (contracts, sortBy, sortOrder = 'asc') => {
  if (!contracts || contracts.length === 0) return [];
  
  const sorted = [...contracts].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle null/undefined values
    if (aValue == null) aValue = '';
    if (bValue == null) bValue = '';
    
    // Handle different data types
    if (sortBy === 'created_at' || sortBy === 'updated_at') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    } else if (sortBy === 'period_count') {
      aValue = parseInt(aValue) || 0;
      bValue = parseInt(bValue) || 0;
    } else {
      aValue = aValue.toString().toLowerCase();
      bValue = bValue.toString().toLowerCase();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

// Pagination utility
export const paginateContracts = (contracts, page = 1, pageSize = 10) => {
  if (!contracts || contracts.length === 0) {
    return {
      data: [],
      totalPages: 0,
      currentPage: 1,
      totalItems: 0,
      hasNext: false,
      hasPrev: false
    };
  }
  
  const totalItems = contracts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    data: contracts.slice(startIndex, endIndex),
    totalPages,
    currentPage,
    totalItems,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

// Highlight search terms in text
export const highlightSearchTerm = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};

// Get search suggestions
export const getSearchSuggestions = (contracts, searchTerm) => {
  if (!searchTerm || searchTerm.length < 2) return [];
  
  const term = searchTerm.toLowerCase();
  const suggestions = new Set();
  
  contracts.forEach(contract => {
    // Contract numbers
    if (contract.contract_no && contract.contract_no.toLowerCase().includes(term)) {
      suggestions.add(contract.contract_no);
    }
    
    // Contact names
    if (contract.contact_name && contract.contact_name.toLowerCase().includes(term)) {
      suggestions.add(contract.contact_name);
    }
    
    // Departments
    if (contract.department && contract.department.toLowerCase().includes(term)) {
      suggestions.add(contract.department);
    }
  });
  
  return Array.from(suggestions).slice(0, 5);
};

// Export search state to URL params
export const exportSearchToURL = (searchTerm, filters, sortBy, sortOrder) => {
  const params = new URLSearchParams();
  
  if (searchTerm) params.set('search', searchTerm);
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);
  if (filters.department && filters.department !== 'all') params.set('department', filters.department);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);
  if (filters.minPeriods) params.set('minPeriods', filters.minPeriods);
  if (filters.maxPeriods) params.set('maxPeriods', filters.maxPeriods);
  if (sortBy) params.set('sortBy', sortBy);
  if (sortOrder && sortOrder !== 'asc') params.set('sortOrder', sortOrder);
  
  return params.toString();
};

// Import search state from URL params
export const importSearchFromURL = (urlParams) => {
  const params = new URLSearchParams(urlParams);
  
  return {
    searchTerm: params.get('search') || '',
    filters: {
      status: params.get('status') || 'all',
      department: params.get('department') || 'all',
      dateFrom: params.get('dateFrom') || '',
      dateTo: params.get('dateTo') || '',
      minPeriods: params.get('minPeriods') || '',
      maxPeriods: params.get('maxPeriods') || ''
    },
    sortBy: params.get('sortBy') || 'created_at',
    sortOrder: params.get('sortOrder') || 'desc'
  };
};
