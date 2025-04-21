export const generateContent = async (prompt) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_GOOGLE_AI_API_URL}?key=${process.env.REACT_APP_GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          })
        }
      );
  
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Google AI Error:', error);
      throw error;
    }
  };
  
  export const classifyDepartment = async (prompt) => {
    const classificationPrompt = `Classify this message for department routing. 
    Respond ONLY with one of: water, electricity, sanitation, housing, general.
    Message: "${prompt}"`;
  
    const responseText = await generateContent(classificationPrompt);
    return responseText.toLowerCase().trim();
  };