import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import StarRating from "./StarRating"; 
import "./ReviewSummary.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper";
import LottieLoadingCircle from "./LottieLoadingCircle";
import { Tooltip } from 'react-tooltip';

function getKoreanValue(value) {
  switch (value) {
    case 'POSITIVE':
      return '긍정적';
    case 'MIXED':
      return '중간';
    case 'NEGATIVE':
      return '부정적';
    default:
      return value;
  }
}

function getPolarityRating(polarity) {
  if (polarity <= -0.8) return "매우 부정적";
  if (polarity <= -0.3) return "부정적";
  if (polarity <= 0.3) return "중립적";
  if (polarity <= 0.8) return "긍정적";
  return "매우 긍정적";
}

function getSubjectivityRating(subjectivity) {
  if (subjectivity < 0.2) return "매우 객관적";
  if (subjectivity < 0.4) return "객관적";
  if (subjectivity < 0.6) return "약간 주관적";
  if (subjectivity < 0.8) return "주관적";
  return "매우 주관적";
}

const ReviewItem = ({ review }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  const reviewText = review.review_comment;
  const isLongReview = reviewText.length > 300; // Adjust the length as needed

  return (
    <div className="review-item">
      <div className="review-rating">
        <StarRating rating={review.review_star_rating} />
      </div>
      <p className="review-text">
        {isExpanded ? reviewText : `${reviewText.substring(0, 300)}${isLongReview ? '...' : ''}`}
        {isLongReview && (
          <span onClick={toggleReadMore} className="read-more">
            {isExpanded ? 'Read Less' : 'Read More'}
          </span>
        )}
      </p>
    </div>
  );
};

function ReviewSummary() {
  const { asin } = useParams();
  const [productDetails, setProductDetails] = useState(() => JSON.parse(localStorage.getItem(asin + "-details")) || {});
  const [summary, setSummary] = useState(() => localStorage.getItem(asin + "-summary") || "");
  const [selectedImage, setSelectedImage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewLoading, setIsReviewLoading] = useState(true);
  const [polarity, setPolarity] = useState(() => parseFloat(localStorage.getItem(asin + "-polarity")) || 0);
  const [subjectivity, setSubjectivity] = useState(() => parseFloat(localStorage.getItem(asin + "-subjectivity")) || 0);
  const [keywords, setKeywords] = useState(() => localStorage.getItem(asin + "-keywords") || "Loading keywords...");
  const [reasons, setReasons] = useState("");
  const [reviews, setReviews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(5);
  const [wordCloud, setWordCloud] = ("");
  

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productDetails.title) { 
        try {
          const productResponse = await axios.get(
            `http://myapp-dev.eba-tpeyvbvr.ap-northeast-2.elasticbeanstalk.com/product/${asin}`
          );
          if (productResponse.data) {
            setProductDetails(productResponse.data);
            setSelectedImage(
              productResponse.data.photo ||
                (productResponse.data.product_photos &&
                  productResponse.data.product_photos[0])
            );
          }
        } catch (error) {
          console.error("Failed to fetch product details", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    const fetchSummary = async () => {
      if (!summary) { // 요약 정보가 로컬 스토리지에 없으면 API 호출
        try {
          const summaryResponse = await axios.post(
            "http://myapp-dev.eba-tpeyvbvr.ap-northeast-2.elasticbeanstalk.com/analyze_reviews",
            { asin }
          );
          console.log("Summary Response:", summaryResponse.data);
          const summaryData = summaryResponse.data.summary[0]; // 첫 번째 원소에서 요약 데이터 추출
          setSummary(summaryData.summary); // 요약 텍스트 설정
          setKeywords(summaryData.keywords.join(", ")); // 키워드 배열을 문자열로 변환
          //setReasons(summaryData.keyword_reasons.join(", "));
          
          const sentimentData = summaryResponse.data.summary[1]; // 두 번째 원소에서 감정 분석 데이터 추출
          setPolarity(sentimentData.average_polarity);
          setSubjectivity(sentimentData.average_subjectivity);

          // const wordCloudData = summaryResponse.data.summary[2];
          // setWordCloud(wordCloudData);
        } catch (error) {
          console.error("Failed to fetch summary", error);
          setSummary("Failed to fetch summary");
          setKeywords("No keywords available");
          setPolarity("Failed to fetch Polarity");
          setSubjectivity("Failed to fetch Subjectivity");
        } finally {
          setIsReviewLoading(false);
        }
      }
    };

    fetchProductDetails();
    fetchSummary();
  }, [asin]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewResponse = await axios.get(`/fetch_reviews/${asin}/${currentPage}`);
        console.log(reviewResponse)
        if (reviewResponse.data.data.reviews) {
          setReviews(reviewResponse.data.data.reviews);
        } else {
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } finally {
      }
    };
  
    fetchReviews();
  }, [asin, currentPage]);

  // 리뷰를 표시하는 함수
  const renderReviews = reviews.map((review, index) => (
    <ReviewItem key={index} review={review} />
  ));

  // 페이지 번호를 렌더링하는 로직
  const renderPageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
    <button key={number} className={`page-number ${number === currentPage ? 'active' : ''}`} 
          onClick={() => setCurrentPage(number)}>
      {number}
    </button>
  ));  

  const cleanPrice = (price) => {
    if (typeof price === 'string') {
      console.log(price)
      price = price.replace(/[^\d.]/g, '');
      console.log(`new price =${price}`)
    }
    return parseFloat(price) || 0;
  };

  const priceInUSD = cleanPrice(productDetails.price);
  const priceInKRW = (priceInUSD * 1370).toFixed(2);

  return (
    <div className="review-summary">
      <header className="App-header">
        <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <h1 className="App-title">Amazon Review Digest Site</h1>
        </a>
      </header>
      {isLoading && (
        <div className="loading-overlay">
          <LottieLoadingCircle />
        </div>
      )}
      {!isLoading && (
        <>
      <div className="product-details">
        <Swiper pagination={true} modules={[Pagination]} className="mySwiper">
          {productDetails.product_photos &&
            productDetails.product_photos.map((photo, index) => (
              <SwiperSlide key={index}>
                <img src={photo} alt="Product" />
              </SwiperSlide>
            ))}
        </Swiper>
        <div className="product-info">
          <a
            href={`https://www.amazon.com/dp/${asin}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <h2>{productDetails.title}</h2>
          </a>
          <p>가격: ${productDetails.price} (약 {priceInKRW} 원)</p>
          <StarRating rating={productDetails.star_rating} />
          <p>
            별점: {productDetails.star_rating} ({productDetails.num_ratings} reviews)
          </p>
        </div>
        <br />
        <br />
        <div className="rating-and-aspects-container">
          <div className="rating-distribution">
            <h2>별점 분포도</h2>
            {productDetails.rating_distribution ? (
              Object.entries(productDetails.rating_distribution).map(([rating, count], index) => (
                <div key={index} className="rating-item">
                  <div className="rating-content">
                    <StarRating rating={parseInt(rating, 10)} /> {/* 별 아이콘을 표시하는 StarRating 컴포넌트를 사용합니다. */}
                    <span>{count}</span>
                  </div>
                </div>
             ))
            ) : (
             <p>No rating distribution available.</p>
            )}
          </div>
          <div className="review-aspects">
            <h2>평가 항목</h2>
            {productDetails.review_aspects ? (
              Object.entries(productDetails.review_aspects).map(([aspect, value], index) => (
                <div key={index} className="aspect-item">
                  <span>{aspect}</span> <span style={{ color: value === 'POSITIVE' ? 'blue' : value === 'MIXED' ? 'black' : 'red'}}>
                   {getKoreanValue(value)}
                  </span>
                </div>
              ))
            ) : (
              <p>평가 항목이 없습니다.</p>
            )}
          </div>
        </div>
      </div>
      <div className="summary-keywords-container">
        <div className="review-content">
         <h3>전반적인 리뷰분석</h3>
          {isReviewLoading && <LottieLoadingCircle />}
          <p>{summary.split('.').map((sentence, index) => <span
            key={index}>{sentence.trim()}{index !== summary.split('.').length - 1 && '.'}<br /></span>)}</p>
        </div>
        <div className="keywords-content">
          <h3>키워드</h3>
          <ul>
           {keywords.split('\n').map((kyeword, index) => {
            const [number, content] = kyeword.split(', ');
            return (
              <li key={index}>
                <span>{number}. </span>
              </li>
            );
           })}
          </ul>
        </div>
      </div>
      <div className="emotion-analysis-container">
        <h3>감정분석</h3>
        <div className="emotion-analysis">
          <div className="summary-content">
              <h4>
                <span
                data-tooltip-id="my-tooltip"
                data-tooltip-content="극성은 리뷰가 긍정적인지 부정적인지를 나타냅니다. -1은 매우 부정적, +1은 매우 긍정적입니다."
                data-tooltip-place="top">
                극성
              </span>
              </h4>
            <Tooltip id="my-tooltip" />
            <p>
             {getPolarityRating(polarity)} ({polarity.toFixed(2)})
            </p>
            <a id = "objectivity">
             <h4>
                <span
                data-tooltip-id="my-tooltip"
                data-tooltip-content="객관성은 리뷰의 내용이 사실과 정보를 기반으로 하는지, 개인적 감정이나 의견을 기반으로 하는지를 나타냅니다. 0은 완전히 객관적, 1은 완전히 주관적입니다."
                data-tooltip-place="top">
                객관성
              </span>
             </h4> 
            </a>
            <p>
              {getSubjectivityRating(subjectivity)} ({subjectivity.toFixed(2)})
            </p>
          </div>
        </div>
      </div>
      <div className="reviews-section">
          <h2>리뷰 원문</h2>
          {isReviewLoading ? <p>Loading reviews...</p> : (
            <>
              {renderReviews}
              <div className="pagination">
                {renderPageNumbers}
              </div>
            </>
          )}
      </div>
      </>
      )}
    </div>
  );
}

export default ReviewSummary;