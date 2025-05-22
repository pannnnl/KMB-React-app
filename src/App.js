import { useState, useEffect } from "react";
import Logo from "./components/Logo";
import SearchForm from "./components/SearchForm";
import BoundContainer from "./components/BoundContainer";
import StopList from "./components/StopList";

// 定義KMB API的基本URL
const baseURL = "https://data.etabus.gov.hk/v1/transport/kmb";

function App() {
  // 狀態定義
  const [errorMsg, setErrorMsg] = useState(""); // 錯誤訊息
  const [allRoutes, setAllRoutes] = useState([]); // 所有路線資料
  const [allStops, setAllStops] = useState([]); // 所有巴士站資料
  const [selectedRoute, setSelectedRoute] = useState([]); // 用戶選擇的路線
  const [selectedRouteObj, setSelectedRouteObj] = useState({}); // 選擇的路線詳細物件
  const [stopList, setStopList] = useState([]); // 路線的站點列表
  const [isLoading, setIsLoading] = useState(true); // 載入狀態，初始為true

  // 輔助函數：帶重試機制的fetch
  async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP錯誤: ${res.status} ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        if (i < retries - 1) {
          console.warn(`重試 ${url}，第 ${i + 1} 次`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          throw error; // 最後一次失敗，拋出錯誤
        }
      }
    }
  }

  // 獲取路線站點資料
  async function fetchStopData(route, service_type, bound) {
    const mappedBound = bound === "O" ? "outbound" : "inbound";
    const url = `${baseURL}/route-stop/${route}/${mappedBound}/${service_type}`;
    try {
      const response = await fetchWithRetry(url);
      console.log(
        `路線站點資料 (路線: ${route}, service_type: ${service_type}, 方向: ${mappedBound}):`,
        response
      );
      return response.data || [];
    } catch (error) {
      console.error(
        `Error fetching stop data for route ${route} (service_type: ${service_type}, ${mappedBound}):`,
        error.message
      );
      return null;
    }
  }

  // 初次載入時獲取路線和巴士站資料
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true); // 開始載入
      try {
        // 並行請求路線和站點資料
        const [routeResults, stopResults] = await Promise.all([
          fetchWithRetry(`${baseURL}/route`),
          fetchWithRetry(`${baseURL}/stop`),
        ]);

        // 記錄API回應，便於調試
        console.log("路線資料:", routeResults);
        console.log("站點資料:", stopResults);

        // 更新狀態
        setAllRoutes(routeResults.data);
        setAllStops(stopResults.data);
        setErrorMsg(""); // 清除錯誤
      } catch (error) {
        console.error("獲取資料失敗:", error.message, error.stack);
        setErrorMsg("無法載入路線或站點資料，請稍後重試");
      } finally {
        setIsLoading(false); // 結束載入
      }
    }

    fetchData();
  }, []); // 無依賴，僅初次載入

  // 當選擇的路線物件改變時，獲取路線站點資料
  useEffect(() => {
    async function fetchRouteStop() {
      const { route, service_type, bound } = selectedRouteObj;
      // 確保route、service_type、bound存在
      if (!route || !service_type || !bound) {
        console.log("無效路線物件，跳過fetchRouteStop:", selectedRouteObj);
        return;
      }

      setIsLoading(true); // 開始載入站點
      try {
        const stopData = await fetchStopData(route, service_type, bound);
        if (stopData === null) {
          throw new Error("無法獲取站點資料");
        }
        setStopList(stopData);
        setErrorMsg(""); // 清除錯誤
      } catch (error) {
        console.error("獲取路線站點失敗:", error.message, error.stack);
        setErrorMsg("無法載入站點資料，請稍後重試");
        setStopList([]); // 清空站點列表
      } finally {
        setIsLoading(false); // 結束載入
      }
    }

    fetchRouteStop();
  }, [selectedRouteObj]); // 依賴selectedRouteObj

  // 檢查用戶輸入的路線是否存在
  function checkRouteExists(userInput) {
    if (isLoading) {
      // 如果正在載入，阻止操作
      setErrorMsg("資料載入中，請稍候...");
      return;
    }
    // 篩選匹配的路線，忽略大小寫
    const busRoutes = allRoutes.filter(
      (r) => r.route.toUpperCase() === userInput.toUpperCase()
    );
    console.log("搜尋路線:", userInput, "匹配結果:", busRoutes);

    if (busRoutes.length < 1) {
      // 無效路線，清空所有相關狀態
      setErrorMsg("無呢條線喎！");
      setSelectedRoute([]);
      setSelectedRouteObj({});
      setStopList([]);
      return;
    }

    // 成功找到路線，更新狀態
    setSelectedRoute(busRoutes);
    setSelectedRouteObj({}); // 等待用戶選擇方向
    setStopList([]); // 清空舊站點列表
    setErrorMsg(""); // 清除錯誤
  }

  // 處理錯誤訊息顯示
  function handleShowError(msg) {
    setErrorMsg(msg);
  }

  // 如果正在載入且無資料，顯示載入畫面
  if (isLoading && !allRoutes.length && !allStops.length) {
    return (
      <div className="container mx-auto text-center mt-8">
        <Logo />
        <p className="text-rose-600">載入路線和站點資料...</p>
      </div>
    );
  }

  // 主渲染邏輯
  return (
    <>
      <Logo />
      <div className="container mx-auto">
        <SearchForm
          showError={handleShowError}
          checkRouteExists={checkRouteExists}
          allRoutes={allRoutes}
          isLoading={isLoading}
        />
      </div>
      {/* 顯示錯誤訊息 */}
      {errorMsg && (
        <p
          id="errorMsg"
          className="border bg-rose-50 border-rose-600 py-2 px-4 rounded-md w-[200px] text-center mx-auto mt-4"
        >
          {errorMsg}
        </p>
      )}
      {/* 顯示站點載入提示 */}
      {isLoading && stopList.length > 0 && (
        <p className="text-center text-rose-600 mt-4">載入站點資料...</p>
      )}
      {/* 顯示路線方向選擇 */}
      {selectedRoute.length > 0 && (
        <BoundContainer
          routeArr={selectedRoute}
          selectRouteObj={setSelectedRouteObj}
        />
      )}
      {/* 顯示站點列表，傳遞 bound 資訊 */}
      <StopList
        stopListArr={stopList}
        allStops={allStops}
        selectedBound={selectedRouteObj.bound}
      />
    </>
  );
}

export default App;
