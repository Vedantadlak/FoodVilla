import { useContext, useEffect, useRef, useState } from "react";
import RestaurantCard from "./RestaurantCard";
import { API_URL, API_URL3 } from "../constants";
import Shimmer from "./Shimmer";
import { Link } from "react-router-dom";
import { filterData } from "../utils/helper";
import useOnlineStatus from "../utils/useOnlineStatus";
import LocationContext from "../utils/LocationContext";
import heroImg from "../../assets/hero-img.jpg";
import BodyShimmer from "./BodyShimmer";

const Body = () => {
  const [searchText, setSearchText] = useState("");
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const totalOpenRestaurants = useRef(0);
  const [totalRestaurants, setTotalRestaurants] = useState(0);
  const [filter, setFilter] = useState("RELEVANCE");
  const [searching, setSearching] = useState(false);

  const { locationGlobal } = useContext(LocationContext);
  const latitude = locationGlobal?.coordinates?.latitude;
  const longitude = locationGlobal?.coordinates?.longitude;

  async function getRestaurants(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const json = await response.json();
      if (url === API_URL || offset === 0) {
        if (url === API_URL) {
          const card = json?.data?.cards.find(
            (card) => card.cardType === "seeAllRestaurants"
          );
          if (card) {
            setTotalRestaurants(card?.data?.data?.totalRestaurants);
            setAllRestaurants(card?.data?.data?.cards);
            setFilteredRestaurants(card?.data?.data?.cards);
            totalOpenRestaurants.current =
              card?.data?.data?.totalOpenRestaurants;
          }
        } else {
          const restaurantList = json.data.cards.map((item) => item.data);
          setFilteredRestaurants(restaurantList);
          setIsLoading(false);
        }
      } else {
        const restaurantList = json?.data?.cards.map((item) => item?.data);
        setAllRestaurants((prevRestaurants) => [
          ...prevRestaurants,
          ...restaurantList,
        ]);
        setFilteredRestaurants((prevRestaurants) => [
          ...prevRestaurants,
          ...restaurantList,
        ]);
        setIsLoading(false);
      }
    } catch (error) {
      console.log("There was an error", error);
    }
  }

  const handleInfiniteScroll = () => {
    try {
      if (
        window.innerHeight + document.documentElement.scrollTop + 10 >=
          document.documentElement.scrollHeight &&
        offset + 16 <= totalOpenRestaurants.current &&
        !searching
      ) {
        setIsLoading(true);
        setOffset((prevOffset) => prevOffset + 16);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      getRestaurants(API_URL);
    }
    setOffset(0);
    window.addEventListener("scroll", handleInfiniteScroll);
    return () => window.removeEventListener("scroll", handleInfiniteScroll);
  }, [latitude, longitude]);

  useEffect(() => {
    if (offset && !searching) {
      getRestaurants(`${API_URL3}offset=${offset}&sortBy=${filter}&`);
    }
  }, [offset]);

  useEffect(() => {
    if (allRestaurants.length > 0 && !searching) {
      getRestaurants(`${API_URL3}&sortBy=${filter}&`);
      setIsLoading(true);
    }
  }, [filter, searching]);

  function handleFilter(event) {
    const selectedFilter = event.target.dataset.filtertype;
    if (filter !== selectedFilter || searching) {
      setFilter(selectedFilter);
      setOffset(0);
      setSearching(false);
      setFilteredRestaurants([]);
      setSearchText("");
    }
  }

  const onlineStatus = useOnlineStatus();

  if (onlineStatus === false) {
    return <p className="font-bold text-center">You are offline ! 🔴</p>;
  }

  return allRestaurants?.length === 0 ? (
    <BodyShimmer />
  ) : (
    <>
      <div className="w-[80vw] flex flex-col justify-center">
        <div className="bg-slate-50 flex flex-col items-center justify-center ">
          <div className="hero-section relative h-[30rem] flex items-center w-full">
            <img
              src={heroImg}
              className="h-full w-full absolute object-cover"
              alt="food background image"
            />
            <div className="my-12 flex flex-grow items-center justify-center z-[2]">
              <div className="flex justify-between w-1/3 border border-slate-400 border-1 focus:w-2/3">
                <input
                  data-testid="search-input"
                  type="text"
                  className="p-3 grow h-12 w-[90%] focus:outline-none"
                  placeholder="Search for restaurants"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                  data-testid="search-btn"
                  className="p-3"
                  aria-label="search"
                  onClick={() => {
                    const filteredData = filterData(searchText, allRestaurants);
                    setFilteredRestaurants(filteredData);
                    setSearching(true);
                  }}
                >
                  <svg
                    aria-hidden="true"
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="">
            <div className="filterHeader lg:px-12 md:px-4 border-b-2 flex justify-between my-8">
              <span className="text-[26px] font-semibold text-gray-800 whitespace-nowrap">
                {totalRestaurants} restaurants
              </span>
              <div
                className="filterList flex gap-4 px-2 text-slate-600 whitespace-nowrap font-semibold"
                onClick={(e) => handleFilter(e)}
              >
                <button
                  className="hover:border-b border-black hover:text-black"
                  data-filtertype="RELEVANCE"
                >
                  Relevance
                </button>
                <button
                  className="hover:border-b border-black hover:text-black"
                  data-filtertype="DELIVERY_TIME"
                >
                  Delivery Time
                </button>
                <button
                  className="hover:border-b border-black hover:text-black"
                  data-filtertype="RATING"
                >
                  Rating
                </button>
                <button
                  className="hover:border-b border-black hover:text-black"
                  data-filtertype="COST_FOR_TWO"
                >
                  Cost: Low To High
                </button>
                <button
                  className="hover:border-b border-black hover:text-black"
                  data-filtertype="COST_FOR_TWO_H2L"
                >
                  Cost: High To Low
                </button>
              </div>
            </div>
            <div
              className="restaurant flex flex-wrap justify-center"
              data-testid="res-list"
            >
              {filteredRestaurants?.length === 0
                ? searchText && (
                    <p className="w-full font-bold text-center">
                      No Restaurants Found
                    </p>
                  )
                : filteredRestaurants
                    .filter((restaurant) => restaurant.type === "restaurant")
                    .map((restaurant) => (
                      <Link
                        to={"/restaurant/" + restaurant.data.id}
                        key={restaurant.data.id}
                      >
                        <RestaurantCard {...restaurant.data} />
                      </Link>
                    ))}
              {isLoading && searchText.length === 0 && <Shimmer />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Body;
