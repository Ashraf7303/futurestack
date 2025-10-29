const categoryIcons = {
  'Web Hosting': '🚀',
  'VPN & Security': '🔒',
  'SaaS': '⚡',
  'Digital Tools': '🛠️'
};

async function loadTools() {
  try {
    const response = await fetch('/.netlify/functions/notion-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    displayTools(data.results);
    displayCategories(data.results);
    updateStats(data.results);
    
  } catch (error) {
    console.error('Error loading tools:', error);
    document.getElementById('tools-container').innerHTML = `
      <div class="loading">
        <p>⚠️ Unable to load tools: ${error.message}</p>
      </div>
    `;
  }
}

function displayCategories(tools) {
  const categories = {};
  
  tools.forEach(tool => {
    const category = tool.properties.Category?.select?.name || 'Uncategorized';
    categories[category] = (categories[category] || 0) + 1;
  });

  const container = document.getElementById('categories-container');
  
  container.innerHTML = Object.entries(categories).map(([name, count]) => `
    <div class="category-card">
      <span class="category-icon">${categoryIcons[name] || '📦'}</span>
      <h3>${name}</h3>
      <p>${getCategoryDescription(name)}</p>
      <span class="tool-count">${count} tool${count !== 1 ? 's' : ''}</span>
    </div>
  `).join('');
}

function displayTools(tools) {
  const container = document.getElementById('tools-container');
  
  const featuredTools = tools.filter(tool => 
    tool.properties.Featured?.checkbox === true
  ).slice(0, 6);

  if (featuredTools.length === 0) {
    container.innerHTML = '<p class="loading">No featured tools yet!</p>';
    return;
  }

  container.innerHTML = featuredTools.map(tool => {
    const props = tool.properties;
    const name = props['Tool Name']?.title?.[0]?.plain_text || 'Unnamed Tool';
    const description = props.Description?.rich_text?.[0]?.plain_text || '';
    const category = props.Category?.select?.name || '';
    const price = props.Price?.rich_text?.[0]?.plain_text || 'Check website';
    const rating = props.Rating?.number || 0;
    const affiliateLink = props['Affiliate Link']?.url || '#';
    const logoUrl = props['Logo URL']?.url || '';

    return `
      <div class="tool-card">
        ${logoUrl ? `
          <div class="tool-header">
            <img src="${logoUrl}" alt="${name}" class="tool-logo" onerror="this.style.display='none'">
            <h3>${name}</h3>
          </div>
        ` : `<h3>${name}</h3>`}
        <span class="tool-category">${category}</span>
        <p class="tool-description">${description}</p>
        <div class="tool-meta">
          <span class="tool-price">${price}</span>
          <span class="tool-rating">${'⭐'.repeat(Math.round(rating))}</span>
        </div>
        <a href="${affiliateLink}" class="tool-link" target="_blank" rel="noopener">
          View ${name} →
        </a>
      </div>
    `;
  }).join('');
}

function updateStats(tools) {
  const toolCount = tools.length;
  document.getElementById('tool-count').textContent = `${toolCount}+`;
}

function getCategoryDescription(category) {
  const descriptions = {
    'Web Hosting': 'High-performance hosting to get your site live fast',
    'VPN & Security': 'Protect your work and stay safe online',
    'SaaS': 'Cloud-based tools to power your workflow',
    'Digital Tools': 'Smart tools to simplify your creative process'
  };
  return descriptions[category] || 'Curated tools for creators';
}

document.addEventListener('DOMContentLoaded', () => {
  loadTools();
  
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});
