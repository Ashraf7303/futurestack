// Notion API Configuration - YOU NEED TO UPDATE THESE
const NOTION_API_KEY = 'YOUR_NOTION_API_KEY_HERE';
const DATABASE_ID = 'YOUR_DATABASE_ID_HERE';
// Category icons
const categoryIcons = {
Web Hosting': '🚀',
VPN & Security': '🔒',
SaaS': '⚡',
Digital Tools': '🛠️'
};
// Load tools from Notion
async function loadTools() {
try {
const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
method: 'POST',
headers: {
Authorization': `Bearer ${NOTION_API_KEY}`,
Notion-Version': '2022-06-28',
Content-Type': 'application/json'
},
body: JSON.stringify({
filter: {
property: 'Status',
select: {
equals: 'Active'
}
},
sorts: [
{
property: 'Rating',
direction: 'descending'
}
]
})
});
const data = await response.json();
displayTools(data.results);
displayCategories(data.results);
updateStats(data.results);
} catch (error) {
console.error('Error loading tools:', error);
document.getElementById('tools-container').innerHTML =
<p class="error">Unable to load tools. Please try again later.</p>';
}
}
// Display categories
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
<span class="tool-count">${count} tools</span>
</div>
`).join('');
}
// Display tools
function displayTools(tools) {
const container = document.getElementById('tools-container');
const featuredTools = tools.filter(tool =>
tool.properties.Featured?.checkbox === true
).slice(0, 6);
if (featuredTools.length === 0) {
container.innerHTML = '<p class="loading">No featured tools yet. Add some in your Notion database!</p>';
return;
}
container.innerHTML = featuredTools.map(tool => {
const props = tool.properties;
const name = props['Tool Name']?.title[0]?.plain_text || 'Unnamed Tool';
const description = props.Description?.rich_text[0]?.plain_text || '';
const category = props.Category?.select?.name || '';
const price = props.Price?.rich_text[0]?.plain_text || 'Check website';
const rating = props.Rating?.number || 0;
const affiliateLink = props['Affiliate Link']?.url || '#';
const logoUrl = props['Logo URL']?.url || '';
return `
<div class="tool-card">
${logoUrl ? `
<div class="tool-header">
<img src="${logoUrl}" alt="${name} logo" class="tool-logo" onerror="this.style.display='none'">
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
// Update stats
function updateStats(tools) {
const toolCount = tools.length;
document.getElementById('tool-count').textContent = `${toolCount}+`;
}
// Category descriptions
function getCategoryDescription(category) {
const descriptions = {
Web Hosting': 'High-performance hosting to get your site live fast',
VPN & Security': 'Protect your work and stay safe online',
SaaS': 'Cloud-based tools to power your workflow',
Digital Tools': 'Smart tools to simplify your creative process'
};
return descriptions[category] || 'Curated tools for creators';
}
// Smooth scroll
document.addEventListener('DOMContentLoaded', () => {
// Load tools on page load
loadTools();
// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
anchor.addEventListener('click', function (e) {
e.preventDefault();
const target = document.querySelector(this.getAttribute('href'));
if (target) {
target.scrollIntoView({
behavior: 'smooth',
block: 'start'
});
}
});
});
});