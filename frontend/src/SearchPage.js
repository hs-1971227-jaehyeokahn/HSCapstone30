import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { useNavigate } from 'react-router-dom';
import StarRating from './StarRating';


function SearchPage() {
  const [inputValue, setInputValue] = useState('');
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPagination, setShowPagination] = useState(false);
  const navigate = useNavigate();
  // const [inputValue, setInputValue] = useState(() => localStorage.getItem('inputValue') || '');
  // const [products, setProducts] = useState(() => JSON.parse(localStorage.getItem('products')) || []);
  // const [currentPage, setCurrentPage] = useState(() => Number(localStorage.getItem('currentPage')) || 1);
  // const [showPagination, setShowPagination] = useState(() => localStorage.getItem('showPagination') === 'true');


  // // 상태를 로컬 스토리지에 저장
  // useEffect(() => {
  //   localStorage.setItem('inputValue', inputValue);
  //   localStorage.setItem('products', JSON.stringify(products));
  //   localStorage.setItem('currentPage', currentPage);
  //   localStorage.setItem('showPagination', showPagination);
  // }, [inputValue, products, currentPage, showPagination]);

  // Handles the search and fetches products based on the page number
  const handleSearch = async (page = 1) => {
    try {
      const response = await axios.post('http://myapp-dev.eba-tpeyvbvr.ap-northeast-2.elasticbeanstalk.com/search_products', { 
        productName: inputValue,
        page 
      });
      console.log(response)
      setProducts(response.data.products || []);
      setCurrentPage(page);
      setShowPagination(true);
      window.scrollTo({ top: 0});
    } catch (error) {
      console.error('Failed to fetch products', error);
    }
  };

  // Event handler for form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    handleSearch(1); // Start from page 1 every new search
  };

  // Renders 5 pagination buttons statically
  const renderPageNumbers = () => {
    return [1, 2, 3, 4, 5].map(page => (
      <button 
        key={page}
        onClick={() => handleSearch(page)}
        disabled={page === currentPage}
        className={page === currentPage ? 'active' : ''}
      >
        {page}
      </button>
    ));
  };

  return (
    <div className="App">
      <header className="App-header">
      <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <h1 className="App-title">Amazon Review Digest Site</h1>
        </a>
      </header>
      <div className="App-content">
        <form onSubmit={handleSubmit} className='search-section'>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="Search-input"
            placeholder="영어로 검색하세요! ex) table, iphone, ..."
          />
          <button type="submit" className="Search-button">Search</button>
        </form>
        <div className='product-list'>
          {products.map(product => (
            <div key={product.asin} onClick={() => navigate(`/reviews/${product.asin}`)} className="Product-item">
              <img src={product.photo} alt={product.title} className="Product-image" />
              <div className="Product-info">
                <p className="Product-title">{product.title}</p>
                <p className="product-price">{product.price}</p>
                <div className='Product-rating'>
                  <StarRating rating={product.star_rating} />
                  <span>({product.star_rating} / 5)</span>
                  <span>({product.num_ratings} Reviews)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showPagination && (
          <div className="pagination">
            {renderPageNumbers()}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchPage;