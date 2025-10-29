// Global state
let allTools = [];
let filteredTools = [];
let currentCategory = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initialized, fetching tools...');
    await fetchTools();
    setupEventListeners();
});

// Fetch tools from Netlify function
async function fetchTools() {
    try {
        console.log('Fetching from Netlify function...');
        const response = await fetch('/.netlify/functions/notion');
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Failed to fetch tools: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Data received:', data);
        
        allTools = parseNotionData(data.results);
        console.log('Parsed tools:', allTools);
        
        filteredTools = [...allTools];
        
        renderTools();
        updateStats();
        generateCategories();
        
    } catch (error) {
        console.error('Error fetching tools:', error);
        showError(error.message);
    }
}

// Parse Notion API response
function parseNotionData(results) {
    if (!results || !Array.isArray(results)) {
        console.error('Invalid results:', results);
        return [];
    }
    
    return results.map(page => {
        const props = page.properties;
        
        // Parse pros and cons - handle both newlines and concatenated text
        const prosText = getPlainText(props['Pros']?.rich_text);
        const consText = getPlainText(props['Cons']?.rich_text);
        
        // Split by newlines first, then by patterns like "word word word WORD word"
        const pros = prosText
            .split(/\r?\n/)
            .filter(p => p.trim())
            .flatMap(p => {
                // If no newlines and text is long, split on capital letters followed by lowercase
                if (p.length > 80 && !p.includes('\n')) {
                    return p.split(/(?=[A-Z][a-z])/).filter(x => x.trim());
                }
                return [p];
            })
            .filter(p => p.trim());
        
        const cons = consText
            .split(/\r?\n/)
            .filter(c => c.trim())
            .flatMap(c => {
                if (c.length > 80 && !c.includes('\n')) {
                    return c.split(/(?=[A-Z][a-z])/).filter(x => x.trim());
                }
                return [c];
            })
            .filter(c => c.trim());
        
        return {
            id: page.id,
            name: getPlainText(props['Tool Name']?.title),
            title: getPlainText(props['Title']?.rich_text),
            category: props['Category']?.select?.name || 'Uncategorized',
            description: getPlainText(props['Description']?.rich_text),
            affiliateLink: props['Affiliate Link']?.url || '#',
            price: getPlainText(props['Price']?.rich_text) || 'Contact for pricing',
            rating: props['Rating']?.number || 0,
            pros: pros,
            cons: cons,
            featured: props['Featured']?.checkbox || false,
            logoUrl: props['Logo URL']?.url || getDefaultLogo(),
        };
    });
}

// Helper to extract plain text from Notion rich text
function getPlainText(richText) {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(text => text.plain_text).join('');
}

// Get default logo based on tool name
function getDefaultLogo() {
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23667eea" width="100" height="100"/><text x="50" y="50" font-size="40" fill="white" text-anchor="middle" dominant-baseline="central">🚀</text></svg>';
}

// Render all tools
function renderTools() {
    console.log('Rendering tools...');
    renderFeaturedTools();
    renderAllTools();
}

// Render featured tools
function renderFeaturedTools() {
    const featuredContainer = document.getElementById('featuredTools');
    const featured = allTools.filter(tool => tool.featured);
    
    console.log('Featured tools:', featured.length);
    
    if (featured.length === 0) {
        featuredContainer.innerHTML = '<p style="text-align: center; color: #4a5568; grid-column: 1/-1;">No featured tools yet. Mark some tools as featured in Notion!</p>';
        return;
    }
    
    featuredContainer.innerHTML = featured.map(tool => createToolCard(tool)).join('');
}

// Render all tools
function renderAllTools() {
    const allToolsContainer = document.getElementById('allTools');
    
    console.log('Rendering all tools:', filteredTools.length);
    
    if (filteredTools.length === 0) {
        allToolsContainer.innerHTML = '<p style="text-align: center; color: #4a5568; grid-column: 1/-1;">No tools found matching your criteria.</p>';
        return;
    }
    
    allToolsContainer.innerHTML = filteredTools.map(tool => createToolCard(tool)).join('');
}

// Create tool card HTML
function createToolCard(tool) {
    const stars = '⭐'.repeat(Math.round(tool.rating));
    const prosList = tool.pros.slice(0, 3).map(pro => `<li>${pro}</li>`).join('');
    const consList = tool.cons.slice(0, 3).map(con => `<li>${con}</li>`).join('');
    const fallbackLogo = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23667eea%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2250%22 font-size=%2240%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22central%22%3E🔧%3C/text%3E%3C/svg%3E';
    
    return `
        <div class="tool-card">
            <div class="tool-header">
                <img src="${tool.logoUrl}" alt="${tool.name} logo" class="tool-logo" onerror="this.onerror=null; this.src='${fallbackLogo}'">
                <div class="tool-info">
                    <h3 class="tool-name">${tool.name}</h3>
                    <span class="tool-category">${tool.category}</span>
                </div>
            </div>
            
            <div class="tool-rating">
                <span class="stars">${stars}</span>
                <span class="rating-number">${tool.rating}/5</span>
            </div>
            
            <p class="tool-description">${tool.description || tool.title}</p>
            
            ${prosList || consList ? `
            <div class="tool-features">
                ${prosList ? `
                <div class="feature-section">
                    <div class="feature-title">✨ Pros</div>
                    <ul class="feature-list pros">${prosList}</ul>
                </div>
                ` : ''}
                
                ${consList ? `
                <div class="feature-section">
                    <div class="feature-title">⚠️ Cons</div>
                    <ul class="feature-list cons">${consList}</ul>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            <div class="tool-footer">
                <div class="tool-price">${tool.price}</div>
                <a href="${tool.affiliateLink}" target="_blank" class="tool-link" rel="noopener noreferrer">
                    Learn More →
                </a>
            </div>
        </div>
    `;
}

// Generate category buttons
function generateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = ['all', ...new Set(allTools.map(tool => tool.category))];
    
    categoryFilter.innerHTML = categories.map(cat => {
        const displayName = cat === 'all' ? 'All Tools' : cat;
        const activeClass = cat === 'all' ? 'active' : '';
        return `<button class="category-btn ${activeClass}" data-category="${cat}">${displayName}</button>`;
    }).join('');
}

// Update stats
function updateStats() {
    document.getElementById('toolCount').textContent = allTools.length;
    
    const uniqueCategories = new Set(allTools.map(tool => tool.category));
    document.getElementById('categoryCount').textContent = uniqueCategories.size;
}

// Setup event listeners
function setupEventListeners() {
    // Category filter
    document.getElementById('categoryFilter').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            currentCategory = e.target.dataset.category;
            filterAndRenderTools();
        }
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterAndRenderTools();
    });
    
    // Sort
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortTools(e.target.value);
        renderAllTools();
    });
}

// Filter and render tools
function filterAndRenderTools() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredTools = allTools.filter(tool => {
        const matchesCategory = currentCategory === 'all' || tool.category === currentCategory;
        const matchesSearch = tool.name.toLowerCase().includes(searchTerm) || 
                            tool.description.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    renderAllTools();
}

// Sort tools
function sortTools(sortBy) {
    switch(sortBy) {
        case 'name':
            filteredTools.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating':
            filteredTools.sort((a, b) => b.rating - a.rating);
            break;
        case 'price-low':
            filteredTools.sort((a, b) => extractPrice(a.price) - extractPrice(b.price));
            break;
        case 'price-high':
            filteredTools.sort((a, b) => extractPrice(b.price) - extractPrice(a.price));
            break;
    }
}

// Extract numeric price from string
function extractPrice(priceString) {
    const match = priceString.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
}

// Show error message
function showError(message) {
    const containers = [document.getElementById('featuredTools'), document.getElementById('allTools')];
    containers.forEach(container => {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; grid-column: 1/-1;">
                <h3 style="color: #f56565; margin-bottom: 15px;">⚠️ Error Loading Tools</h3>
                <p style="color: #4a5568; margin-bottom: 10px;">${message}</p>
                <p style="color: #718096; font-size: 14px;">Check the browser console for more details.</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Retry
                </button>
            </div>
        `;
    });
}
