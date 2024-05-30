import React from 'react';
import fullStar from './icons/full-star.png';  // Add your full star image in your project
import halfStar from './icons/half-star.png';  // Add your half star image in your project
import emptyStar from './icons/empty-star.png'; // Add your empty star image in your project

function StarRating({ rating }) {
    const totalStars = 5;
    const fullStars = Math.floor(rating); // Ensures a whole number of full stars
    const halfStars = rating % 1 >= 0.5 ? 1 : 0; // Correctly calculates whether there should be a half star
    const emptyStars = totalStars - fullStars - halfStars; // Total should not exceed 5 stars

    return (
        <div className="star-rating">
            {Array.from({length: fullStars}, (_, i) => <img key={i} src={fullStar} alt="Full Star" />)}
            {halfStars > 0 && <img src={halfStar} alt="Half Star" />}
            {Array.from({length: emptyStars}, (_, i) => <img key={i} src={emptyStar} alt="Empty Star" />)}
        </div>
    );
}

export default StarRating;