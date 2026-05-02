import useDataStore from '../../store/dataStore';

// Mocking Axios functionality to point to local dataStore
const axiosInstance = {
  get: async (url) => {
    const store = useDataStore.getState();
    const parts = url.split('/');
    const endpoint = parts[1];
    const subEndpoint = parts[2];
    
    let data = [];
    
    if (endpoint === 'purchase') {
      data = subEndpoint === 'vendors' ? store.vendors : store.purchaseOrders;
    } else {
      switch(endpoint) {
        case 'orders': data = store.orders; break;
        case 'customers': data = store.customers; break;
        case 'production': data = store.production; break;
        case 'inventory': data = store.inventory; break;
        case 'products': data = store.products; break;
        case 'billing': data = store.invoices; break;
        case 'qc': data = store.qc; break;
        case 'dispatch': data = store.dispatch; break;
        case 'sales': data = store.orders.filter(o => o.type === 'Quotation'); break;
        default: data = [];
      }
    }
    
    return { data };
  },
  
  post: async (url, payload) => {
    const store = useDataStore.getState();
    const endpoint = url.split('/')[1];
    const collectionMap = {
      'orders': 'orders',
      'customers': 'customers',
      'production': 'production',
      'inventory': 'inventory',
      'products': 'products',
      'purchase': 'purchaseOrders',
      'billing': 'invoices',
      'qc': 'qc',
      'dispatch': 'dispatch'
    };
    
    const collection = collectionMap[endpoint];
    if (collection) {
      const newItem = store.addItem(collection, payload);
      return { data: newItem };
    }
    return { data: { message: 'Success' } };
  },

  put: async (url, payload) => {
    const store = useDataStore.getState();
    const parts = url.split('/');
    const endpoint = parts[1];
    let id = parts[2];
    
    // SPECIAL CASE: Production Stage Update
    if (endpoint === 'production' && parts[3] === 'stage') {
      const prodOrder = store.production.find(p => p._id === id);
      if (prodOrder) {
        const updatedStages = prodOrder.stages.map(s => 
          s.stage === payload.stage ? { ...s, status: payload.status, assignedTo: payload.assignedTo } : s
        );
        store.updateItem('production', id, { stages: updatedStages, currentStage: payload.stage });
        return { data: { message: 'Stage Updated' } };
      }
    }
    
    const collectionMap = {
      'orders': 'orders',
      'production': 'production',
      'inventory': 'inventory',
      'purchase': 'purchaseOrders',
      'customers': 'customers',
      'billing': 'invoices'
    };
    
    const collection = collectionMap[endpoint];
    if (collection && id) {
      store.updateItem(collection, id, payload);
    }
    return { data: { message: 'Updated' } };
  },

  delete: async (url) => {
    const store = useDataStore.getState();
    const parts = url.split('/');
    const endpoint = parts[1];
    let id = parts[2];

    if (endpoint === 'purchase' && parts[2] === 'orders') {
      id = parts[3];
    }

    const collectionMap = {
      'orders': 'orders',
      'production': 'production',
      'inventory': 'inventory',
      'purchase': 'purchaseOrders',
      'customers': 'customers'
    };
    
    const collection = collectionMap[endpoint];
    if (collection && id) {
      store.deleteItem(collection, id);
    }
    return { data: { message: 'Deleted' } };
  },
  
  defaults: { baseURL: 'LOCAL_MODE' },
  interceptors: {
    request: { use: () => {} },
    response: { use: () => {} }
  }
};

export default axiosInstance;

