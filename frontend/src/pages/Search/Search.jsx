import React, { useContext, useState, useEffect } from "react";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../../components/FoodItem/FoodItem";
import { useSearchParams } from "react-router-dom";

const Search = () => {
  const { food_list } = useContext(StoreContext);
  const [params] = useSearchParams();
  const keyword = params.get("keyword")?.toLowerCase();
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!keyword) return;
    const filter = food_list.filter(
      food =>
        food.name.toLowerCase().includes(keyword) ||
        food.description.toLowerCase().includes(keyword)
    );
    setResults(filter);
  }, [keyword, food_list]);

  return (
    <div style={{ padding: "100px 20px " }}>
      <h2>Kết quả tìm kiếm cho <strong>{keyword}</strong></h2>

      {results.length === 0 ? (
        <p>Không tìm thấy món nào phù hợp.</p>
      ) : (
        <div className="food-display-list">
          {results.map((food) => (
            <FoodItem
              key={food._id}
              id={food._id}
              name={food.name}
              price={food.price}
              image={food.image}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
