import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import "./App.css";

function Home() {
  const [inputValue, setInputValue] = useState('');
  const [products, setProducts] = useState([]);
  const history = useHistory();

  const handleSearch = async () => {
    const response = await axios.post('http://localhost:3000/search_products', { productName: inputValue });
    setProducts(response.data.products || []);
  };



  const handleSelectProduct = (asin) => {
    history.push(`/review-summary/${asin}`);
  };

  return (
    <div className="App"> {/* 기존 App 클래스를 이용 */}
      <header className="App-header"> {/* 헤더 스타일 적용 */}
        <h1 className="App-title">Amazon Review Website</h1>
      </header>
      <div className="App-content"> {/* 컨텐츠 영역 스타일 적용 */}
        <h2>원하시는 상품을 입력하세요</h2>
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        <button onClick={handleSearch}>Search</button>
        {products.map(product => (
          <div key={product.asin} onClick={() => handleSelectProduct(product.asin)} className="Product-item"> {/* 제품 아이템 스타일 적용 */}
            <p>{product.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
