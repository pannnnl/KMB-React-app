import { useState } from "react";

function SearchForm({ showError, checkRouteExists }) {
  const [userInput, setUserInput] = useState("");
  function handleUserInputChange(e) {
    const input = e.target.value.trim().replaceAll(" ", "").toUpperCase();
    setUserInput(input);
  }

  function handleOnClick(e) {
    e.preventDefault();
    const regex = new RegExp(/^[a-zA-Z0-9]*$/);
    if (regex.test(userInput)) {
      checkRouteExists(userInput);
    } else {
      showError("唔好玩嘢喎！");
    }
  }
  return (
    <div>
      <div className="items-center mx-auto mb-3 space-y-4 max-w-sm sm:flex sm:space-y-0">
        <div className="relative w-full">
          <label
            htmlFor="email"
            className="hidden mb-2 text-sm font-medium text-gray-900"
          >
            巴士路線
          </label>
          <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e60012"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-bus-icon lucide-bus"
            >
              <path d="M8 6v6" />
              <path d="M15 6v6" />
              <path d="M2 12h19.6" />
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
              <circle cx="7" cy="18" r="2" />
              <path d="M9 18h5" />
              <circle cx="16" cy="18" r="2" />
            </svg>
          </div>
          <input
            id="userInput"
            className="block p-3 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 sm:rounded-none sm:rounded-l-lg focus:ring-rose-500 focus:border-rose-500"
            placeholder="輸入巴士路線"
            type="text"
            value={userInput}
            onChange={handleUserInputChange}
          />
        </div>
        <div className="w-[150px]">
          <button
            id="submitBtn"
            className="py-3 px-5 w-full text-sm font-medium text-center text-white rounded-lg border cursor-pointer bg-rose-700 border-rose-600 sm:rounded-none sm:rounded-r-lg hover:bg-rose-800 focus:ring-4 focus:ring-rose-300"
            onClick={handleOnClick}
          >
            搜尋路線
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchForm;
