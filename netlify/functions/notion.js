// Netlify Serverless Function to fetch data from Notion API
const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: '',
        };
    }

    // Accept both GET and POST requests
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }

    try {
        // Initialize Notion client with your API key from environment variables
        const notion = new Client({
            auth: process.env.NOTION_API_KEY,
        });

        // Query your database
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            sorts: [
                {
                    property: 'Rating',
                    direction: 'descending',
                },
            ],
        });

        // Return the data
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response),
        };

    } catch (error) {
        console.error('Error fetching from Notion:', error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Failed to fetch data from Notion',
                message: error.message,
                details: error.code || 'Unknown error'
            }),
        };
    }
};
