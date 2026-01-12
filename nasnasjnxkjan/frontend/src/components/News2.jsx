import React, { useEffect, useState } from 'react';
import Card from './Card';
import './Card.css';

const News2 = () => {
  const [search, setSearch] = useState('vaccine');
  const [newsData, setNewsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const API_KEY = '9c3ed8ee95884dec979460a60f96675b'; // Move to .env for production

  const getData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${search}&apiKey=${API_KEY}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch vaccine news');
      }
      const jsonData = await response.json();
      setNewsData(jsonData.articles.slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getData();
  }, [search]);

  const handleInput = (e) => {
    setSearch(e.target.value);
  };

  const userInput = (event) => {
    setSearch(event.target.value);
  };

  return (
    <div className="news-container">
      <div className="flex flex-col items-center gap-4 my-16 text-[#262626] md:mx-10">
        <h1 className="text-3xl font-medium">Vaccine News Updates</h1>
        <div className="categoryBtn flex justify-center flex-wrap gap-4 mt-8">
          <button
            onClick={userInput}
            value="vaccine"
            className="bg-[#007bff] text-white text-sm sm:text-base px-8 py-3 rounded-full border border-blue-700 shadow-sm hover:bg-[#0056b3] hover:shadow-md hover:scale-105 transition-all duration-300"
          >
            Vaccine
          </button>
          <button
            onClick={userInput}
            value="health"
            className="bg-[#007bff] text-white text-sm sm:text-base px-8 py-3 rounded-full border border-blue-700 shadow-sm hover:bg-[#0056b3] hover:shadow-md hover:scale-105 transition-all duration-300"
          >
            Health
          </button>
          <button
            onClick={userInput}
            value="covid"
            className="bg-[#007bff] text-white text-sm sm:text-base px-8 py-3 rounded-full border border-blue-700 shadow-sm hover:bg-[#0056b3] hover:shadow-md hover:scale-105 transition-all duration-300"
          >
            COVID-19
          </button>
          <button
            onClick={userInput}
            value="immunization"
            className="bg-[#007bff] text-white text-sm sm:text-base px-8 py-3 rounded-full border border-blue-700 shadow-sm hover:bg-[#0056b3] hover:shadow-md hover:scale-105 transition-all duration-300"
          >
            Immunization
          </button>
          <button
            onClick={userInput}
            value="vaccination"
            className="bg-[#007bff] text-white text-sm sm:text-base px-8 py-3 rounded-full border border-blue-700 shadow-sm hover:bg-[#0056b3] hover:shadow-md hover:scale-105 transition-all duration-300"
          >
            Vaccination
          </button>
        </div>
      </div>
      {loading && <p className="loading">Loading vaccine news...</p>}
      {error && <p className="error">{error}</p>}
      {newsData && !loading && !error && <Card data={newsData} />}
    </div>
  );
};

export default News2;