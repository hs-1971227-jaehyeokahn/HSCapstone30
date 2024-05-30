from flask import Flask, request, jsonify, send_from_directory
import requests
from openai import OpenAI
import os
from flask_cors import CORS
import time
from textblob import TextBlob
import numpy as np
#%%
application = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(application)
#%%
# rapid_api_key = ""
# OpenAI_api_key = ""
# cloud_api_key = ""
rapid_api_key = "YOUR_API_KEY"
OpenAI_api_key = "YOUR_API_KEY"
cloud_api_key = "YOUR_API_KEY"
#%%
@application.errorhandler(404)
def not_found(error):
    return render_template('404.html'), 404
#%%
@application.errorhandler(500)
def internal_error(error):
    application.logger.error(f"Server Error: {error}")
    return jsonify({f"error": "Internal server error"}), 500
#%%
@application.route('/', defaults={'path': ''})
@application.route('/<path:path>')
def catch_all(path):
    return send_from_directory(application.static_folder, 'index.html')
#%%
@application.route('/product/<asin>', methods=['GET'])
def product(asin):
    product_info = get_product_info_by_asin(asin)
    if product_info:
        return jsonify(product_info)
    else:
        return jsonify({"error": "Product not found"}), 404
#%%
def get_product_info_by_asin(asin):
    url = "https://real-time-amazon-data.p.rapidapi.com/product-details"
    querystring = {
        "asin":asin,
        "country":"US",
    }
    
    headers = {
    	"X-RapidAPI-Key": rapid_api_key,
    	"X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }
    response = requests.get(url, headers=headers, params=querystring)
    if response.status_code == 200:
        data = response.json().get('data', {})
        product_info = {
            "title": data.get('product_title'),
            "price": data.get('product_price'),
            "photo": data.get('product_photo'),
            "star_rating": data.get('product_star_rating'),
            "num_ratings": data.get('product_num_ratings'),
            "description": data.get('product_description'),
            "product_photos": data.get("product_photos", []),
            "rating_distribution": data.get("rating_distribution", {}),
            "review_aspects": data.get("review_aspects", {})
        }
        return product_info
    else:
        print(f"Failed to fetch product info for ASIN {asin}, HTTP Status Code: {response.status_code}")
        return None
#%%
@application.route('/search_products', methods=['POST'])
def search_products():
    start_time = time.time()
    data = request.get_json()
    product_name = data.get('productName', '')
    page_number = data.get('page', '1')  # 기본 페이지 번호를 1로 설정
    products = search_product(product_name, page_number)
    print(f'search_products took {time.time() - start_time:.2f} seconds')
    return jsonify({"products": products})
#%%
def search_product(product_name, page_number):
    start_time = time.time()
    url = "https://real-time-amazon-data.p.rapidapi.com/search"
    params = {
        "query": product_name, 
        "page": page_number,  # 동적 페이지 번호 사용
        "country": "US",
        "sort_by": 'BEST_SELLERS',
        "category_id": "aps"
    }
    headers = {
        "X-RapidAPI-Key": rapid_api_key,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }
    response = requests.get(url, headers=headers, params=params)
    data = response.json()
    if response.status_code == 200 and data['status'] == "OK":
        products = [
            {
                "asin": product['asin'],
                "title": product['product_title'],
                "price": product['product_price'],
                "star_rating": product['product_star_rating'],
                "num_ratings": product['product_num_ratings'],
                "url": product['product_url'],
                "photo": product['product_photo']
            } for product in data['data']['products']
        ]
        return products
    else:
        return [
            {
                "status_code": response.status_code,
                "data": response.json()
            }
        ]
#%%
@application.route('/analyze_reviews', methods=['POST'])
def analyze_reviews():
    data = request.get_json()
    asin = data.get('asin', '')
    summary = analyze_product_reviews(asin)  
    return jsonify({"summary": summary})
#%%
def analyze_product_reviews(asin):
    url = "https://real-time-amazon-data.p.rapidapi.com/product-reviews"
    headers = {
    	"X-RapidAPI-Key": f"{rapid_api_key}",
    	"X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }
    querystring = {
        "asin": asin,
        "country":"US",
        "verified_purchases_only":"false",
        "images_or_videos_only":"false",
        "current_format_only":"false",
        "page":"1"
    }
    response = requests.get(url, headers=headers, params=querystring)
    data = response.json()
    if response.status_code == 200:
        reviews_text = ' & '.join([review['review_comment'] for review in data['data']['reviews']])
        reviews = [review['review_comment'] for review in data['data']['reviews']]
        
        # 리뷰 요약 수행
        summary = summarize_reviews_with_openai(reviews_text)
        
        # 워드 클라우드 생성
        #wordCloud = generate_word_cloud(reviews_text)

        # 감정 분석 수행
        polarities = [TextBlob(review).sentiment.polarity for review in reviews]
        subjectivities = [TextBlob(review).sentiment.subjectivity for review in reviews]
        
        # 평균 극성과 객관성 계산
        avg_polarity = np.mean(polarities)
        avg_subjectivity = np.mean(subjectivities)
        
        sentiment_data = {
            "average_polarity": avg_polarity,
            "average_subjectivity": avg_subjectivity
        }
        
        return summary, sentiment_data #, wordCloud
    else:
        return "No reviews found", None
#%%
def generate_word_cloud(text):
    url = "https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud"

    payload = {
        "text": text,
        "scale": 0.5,
        "width": 400,   
        "height": 400,
        "colors": ["#375E97", "#FB6542", "#FFBB00", "#3F681C"],
        "font": "Tahoma",
        "use_stopwords": True,
        "language": "en",
        "uppercase": False
    }
    headers = {
        "content-type": "application/json",
        "X-RapidAPI-Key": cloud_api_key,
        "X-RapidAPI-Host": "textvis-word-cloud-v1.p.rapidapi.com"
    }

    response = requests.post(url, json=payload, headers=headers)

    return(response.text())
#%%
@application.route('/fetch_reviews/<asin>/<int:page>', methods=['GET'])
def fetch_reviews(asin, page=1):
    """Fetch product reviews for a given ASIN and page number."""
    url = "https://real-time-amazon-data.p.rapidapi.com/product-reviews"
    headers = {
        "X-RapidAPI-Key": rapid_api_key,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }
    querystring = {
        "asin": asin,
        "country": "US",
        "verified_purchases_only": "false",
        "images_or_videos_only": "false",
        "current_format_only": "false",
        "page": page
    }
    response = requests.get(url, headers=headers, params=querystring)
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({"error": "Unable to fetch reviews", "status_code": response.status_code}), 404

#%%
def summarize_reviews_with_openai(text):
    client = OpenAI(api_key=OpenAI_api_key)
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 제품의 리뷰들을 분석 후 요약하는 전문가입니다. 답변할 때는 마크다운을 추가하지 말아주세요."},
                {"role": "user", "content": f"제공되는 리뷰를 분석 후 제품의 특징 및 장단점을 5줄로 요약해서 제공해주세요. 또한, 제품의 특징을 잘 나타내는 단어를 5가지정도 선정해주세요. 그리고, 각 단어를 선정한 이유를 알려주세요. 추가로, 답변의 양식은 다음과 같이 해주세요. 리뷰 요약: 요약한 내용 \n 단어: 단어1 (선정 이유), 단어2 (선정 이유), ...  :{text}"}
            ]
        )
        if response.choices and response.choices[0].message and response.choices[0].message.content:
            result = response.choices[0].message.content.strip().split("단어:")
            summary = result[0].replace("리뷰 요약: ", "").strip()
            keywords = result[1].strip().split(", ")
            #keyword_reasons=result[2].strip().split(", ")
            return {"summary": summary, "keywords": keywords}
        else:
            return "No summary available due to missing content"
    except Exception as e:
        return "Error generating summary"
#%%
if __name__ == '__main__':
    application.debug=False
    application.run(host='0.0.0.0', port=8000)