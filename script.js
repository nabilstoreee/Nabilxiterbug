// ubah aja sih wkwkw @skytech
const CONFIG = {
    githubToken: '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',
    repoOwner: 'nabilstoreee',
    repoName: 'Nabilxiterbug',
    filePath: 'tokens.json',
    apiTimeout: 10000 
  };
 
  const elements = {
    responseMessage: document.getElementById('responseMessage'),
    tokenList: document.getElementById('tokenList'),
    totalUsers: document.getElementById('totalUsers'),
    activeTokens: document.getElementById('activeTokens'),
    storageUsed: document.getElementById('storageUsed'),
    tokenForm: document.getElementById('tokenForm'),
    refreshBtn: document.getElementById('refreshBtn'),
    welcomeModal: document.getElementById('welcomeModal'),
    welcomeModalClose: document.getElementById('welcomeModalClose'),
    confirmModal: document.getElementById('confirmModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn')
  };
  

  const state = {
    tokenToDelete: null,
    isLoading: false
  };
  
  function init() {
    addEventListeners();
    setTimeout(() => {
      elements.welcomeModal.classList.add('show');
    }, 300);
    updateTokenList();
  }
  
  function addEventListeners() {
    elements.tokenForm.addEventListener('submit', handleFormSubmit);
    elements.refreshBtn.addEventListener('click', updateTokenList);
    elements.welcomeModalClose.addEventListener('click', () => closeModal('welcomeModal'));
    elements.confirmDeleteBtn.addEventListener('click', () => confirmDelete(true));
    elements.cancelDeleteBtn.addEventListener('click', () => confirmDelete(false));
  }
  
  async function handleFormSubmit(event) {
    event.preventDefault();
    if (state.isLoading) return;
    
    const token = document.getElementById('token').value.trim();
    const nama = document.getElementById('nama').value.trim();
    
    showMessage('⏳ Processing...', 'info');
    
    if (!token || !nama) {
      showMessage('⚠️ Please fill all fields!', 'warning');
      return;
    }
    
    state.isLoading = true;
    
    try {
      const headers = {
        Authorization: `token ${CONFIG.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      

      const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
      const response = await fetchWithTimeout(url, { 
        method: 'GET', 
        headers,
        timeout: CONFIG.apiTimeout
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      const content = atob(data.content);
      const tokens = JSON.parse(content);
      
      if (tokens.some(item => item.token === token)) {
        showMessage('⚠️ Token already exists!', 'warning');
        state.isLoading = false;
        return;
      }
      
      tokens.push({ nama, token });
      
      const updateResponse = await fetchWithTimeout(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Add new token',
          content: btoa(JSON.stringify(tokens, null, 2)),
          sha: data.sha
        }),
        timeout: CONFIG.apiTimeout
      });
      
      if (updateResponse.ok) {
        showMessage('✅ Token added successfully!', 'success');
        elements.tokenForm.reset();
        updateTokenList();
      } else {
        throw new Error('Failed to update tokens');
      }
    } catch (err) {
      console.error('Error:', err);
      showMessage('❌ An error occurred', 'error');
    } finally {
      state.isLoading = false;
    }
  }
  
  async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    
    clearTimeout(id);
    return response;
  }
  
  async function updateTokenList() {
    if (state.isLoading) return;
    state.isLoading = true;
    
    showMessage('⏳ Loading tokens...', 'info');
    
    try {
      const headers = {
        Authorization: `token ${CONFIG.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
      const response = await fetchWithTimeout(url, { 
        method: 'GET', 
        headers,
        timeout: CONFIG.apiTimeout
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      const content = atob(data.content);
      const tokens = JSON.parse(content);
      
      renderTokenList(tokens);
      updateStats(tokens);
      
      showMessage('✅ Tokens loaded', 'success');
      setTimeout(() => {
        elements.responseMessage.style.display = 'none';
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
      showMessage('❌ Failed to load tokens', 'error');
    } finally {
      state.isLoading = false;
    }
  }
  
  function renderTokenList(tokens) {
    elements.tokenList.innerHTML = '';
    
    if (tokens.length === 0) {
      elements.tokenList.innerHTML = `
        <div style="text-align: center; padding: 1rem; color: var(--gray);">
          No tokens found
        </div>
      `;
      return;
    }
    
    const fragment = document.createDocumentFragment();
    
    tokens.forEach(({ nama, token }) => {
      const li = document.createElement('li');
      li.className = 'token-item';

      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn copy-btn';
      copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
      copyBtn.addEventListener('click', () => copyToClipboard(token));
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-btn delete-btn';
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
      deleteBtn.addEventListener('click', () => removeToken(token));
      
      li.innerHTML = `
        <div class="token-info">
          <div class="token-name"><i class="fas fa-user-circle"></i> ${nama}</div>
          <div class="token-value"><i class="fas fa-key"></i> ${token}</div>
        </div>
      `;
      
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'token-actions';
      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(deleteBtn);
      
      li.appendChild(actionsDiv);
      fragment.appendChild(li);
    });
    
    elements.tokenList.appendChild(fragment);
  }
  
  function updateStats(tokens) {
    elements.totalUsers.textContent = tokens.length;
    elements.activeTokens.textContent = tokens.length;
    
    const jsonSize = new TextEncoder().encode(JSON.stringify(tokens)).length;
    elements.storageUsed.textContent = `${(jsonSize / 1024).toFixed(2)}KB`;
  }
  
  function removeToken(token) {
    state.tokenToDelete = token;
    elements.confirmModal.classList.add('show');
  }

  async function confirmDelete(shouldDelete) {
    elements.confirmModal.classList.remove('show');
    
    if (!shouldDelete || !state.tokenToDelete) {
      state.tokenToDelete = null;
      return;
    }
    
    showMessage('⏳ Deleting token...', 'info');
    state.isLoading = true;
    
    try {
      const headers = {
        Authorization: `token ${CONFIG.githubToken}`,
        Accept: 'application/vnd.github.v3+json'
      };
      
      const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/contents/${CONFIG.filePath}`;
      const response = await fetchWithTimeout(url, { 
        method: 'GET', 
        headers,
        timeout: CONFIG.apiTimeout
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      const content = atob(data.content);
      let tokens = JSON.parse(content);
      
      tokens = tokens.filter(({ token }) => token !== state.tokenToDelete);
      
      const updateResponse = await fetchWithTimeout(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: 'Remove token',
          content: btoa(JSON.stringify(tokens, null, 2)),
          sha: data.sha
        }),
        timeout: CONFIG.apiTimeout
      });
      
      if (updateResponse.ok) {
        showMessage('🗑️ Token deleted', 'success');
        updateTokenList();
      } else {
        throw new Error('Failed to delete token');
      }
    } catch (err) {
      console.error('Error:', err);
      showMessage('❌ Failed to delete token', 'error');
    } finally {
      state.isLoading = false;
      state.tokenToDelete = null;
    }
  }
  
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showMessage('✅ Copied to clipboard!', 'success');
      setTimeout(() => {
        elements.responseMessage.style.display = 'none';
      }, 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      showMessage('❌ Failed to copy', 'error');
    });
  }
  
  function showMessage(message, type) {
    elements.responseMessage.textContent = message;
    elements.responseMessage.className = type;
    elements.responseMessage.style.display = 'block';
  }

  function closeModal(id) {
    document.getElementById(id).classList.remove('show');
  }
  
  document.addEventListener('DOMContentLoaded', init);
