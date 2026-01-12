import React from 'react';
import './Card.css';

const Card = ({ data }) => {
  return (
    <div className="cardContainer">
      {data.map((curItem, index) => {
        if (!curItem.urlToImage) {
          return null;
        }
        return (
          <div className="card" key={index}>
            <img src={curItem.urlToImage} alt={curItem.title} />
            <div className="content">
              <a
                className="title"
                href={curItem.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {curItem.title}
              </a>
              <p>{curItem.description}</p>
              <button
                onClick={() => window.open(curItem.url, '_blank', 'noopener,noreferrer')}
              >
                Read Article
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Card;