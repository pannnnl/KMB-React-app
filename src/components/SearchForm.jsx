import { useState, useRef, useEffect } from "react";

function SearchForm({ showError, checkRouteExists, allRoutes, isLoading }) {
  // 狀態定義
  const [userInput, setUserInput] = useState(""); // 用戶輸入的路線號碼
  const [suggestions, setSuggestions] = useState([]); // 過濾後的路線建議
  const [showSuggestions, setShowSuggestions] = useState(false); // 是否顯示選單
  const wrapperRef = useRef(null); // 用於監聽輸入框焦點

  // 處理輸入變化
  function handleUserInputChange(e) {
    const input = e.target.value.trim().replaceAll(" ", "").toUpperCase();
    setUserInput(input);

    // 如果輸入為空，清空建議並隱藏選單
    if (!input) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // 過濾匹配的路線（以輸入開頭，忽略大小寫）
    const filteredRoutes = allRoutes
      .filter((routeObj) => routeObj.route.toUpperCase().startsWith(input))
      .map((routeObj) => routeObj.route)
      .sort();
    setSuggestions([...new Set(filteredRoutes)]); // 去除重複路線
    setShowSuggestions(true); // 顯示選單
  }

  // 處理選單項點擊
  function handleSuggestionClick(route) {
    console.log("選擇路線:", route); // 記錄選擇的路線
    setUserInput(route); // 僅更新輸入框
    setShowSuggestions(false); // 隱藏選單
    // 不調用checkRouteExists，等待用戶點擊搜尋按鈕
  }

  // 處理搜尋按鈕點擊
  function handleOnClick(e) {
    e.preventDefault();
    const regex = new RegExp(/^[a-zA-Z0-9]*$/); // 驗證輸入
    if (!regex.test(userInput)) {
      showError("唔好玩嘢喎！");
      return;
    }
    if (!userInput) {
      showError("請輸入路線號碼！");
      return;
    }
    console.log("按鈕搜尋:", userInput); // 記錄按鈕搜尋
    showError(""); // 清除錯誤
    checkRouteExists(userInput); // 觸發搜尋，顯示路線資料
    setShowSuggestions(false); // 隱藏選單
  }

  // 監聽點擊事件，點擊選單外隱藏建議
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false); // 點擊輸入框外，隱藏選單
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // 清理事件
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center mx-auto mb-3 max-w-sm">
      <div className="w-full flex">
        <div className="relative flex-1">
          <label
            htmlFor="userInput"
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
            className="block p-3 pl-10 w-full text-base text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-rose-500 focus:border-rose-500 rounded-r-none touch-action-manipulation"
            placeholder={isLoading ? "載入路線資料中..." : "輸入巴士路線"}
            type="text"
            value={userInput}
            onChange={handleUserInputChange}
            onFocus={() => userInput && setShowSuggestions(true)}
            disabled={isLoading}
          />
        </div>
        <div className="w-[150px]">
          <button
            id="submitBtn"
            className="py-3 px-5 w-full text-sm font-medium text-center text-white rounded-lg border cursor-pointer bg-rose-700 border-rose-600 rounded-l-none hover:bg-rose-800 focus:ring-4 focus:ring-rose-300"
            onClick={handleOnClick}
            disabled={isLoading}
          >
            搜尋路線
          </button>
        </div>
      </div>
      {/* 下拉選單，定位在輸入框正下方 */}
      {showSuggestions && (
        <div
          ref={wrapperRef}
          className="absolute z-20 w-full bg-white border border-rose-200 rounded-md shadow-md top-[100%] left-0 max-h-60 overflow-y-auto"
        >
          {suggestions.length > 0 ? (
            <ul>
              {suggestions.map((route) => (
                <li
                  key={route}
                  className="px-3 py-4 text-sm text-rose-600 hover:bg-rose-100 cursor-pointer"
                  onClick={() => handleSuggestionClick(route)}
                >
                  {route}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-sm text-rose-600">無匹配路線</div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchForm;
