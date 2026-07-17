exports.handler = async (event, context) => {
  try {
    // 1. Exchange your secure Netlify API key for a short-lived token from Google
    const response = await fetch('https://googleapis.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    // 2. Send that temporary token back to the browser safely
    return {
      statusCode: 200,
      body: JSON.stringify({ token: data.token }),
    };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
