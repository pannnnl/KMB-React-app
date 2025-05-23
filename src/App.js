import { useState, useEffect } from "react";
import Logo from "./components/Logo";
import SearchForm from "./components/SearchForm";
import BoundContainer from "./components/BoundContainer";
import StopList from "./components/StopList";

// 定義 KMB 和城巴 API 的基本 URL
const baseURLs = {
  KMB: "https://data.etabus.gov.hk/v1/transport/kmb",
  CTB: "https://rt.data.gov.hk/v2/transport/citybus",
};

function App() {
  // 狀態定義
  const [errorMsg, setErrorMsg] = useState(""); // 錯誤訊息
  const [allRoutes, setAllRoutes] = useState([]); // 所有路線資料（KMB 和城巴）
  const [allStops, setAllStops] = useState([]); // 所有巴士站資料（KMB 和城巴）
  const [selectedRoute, setSelectedRoute] = useState([]); // 用戶選擇的路線
  const [selectedRouteObj, setSelectedRouteObj] = useState({}); // 選擇的路線詳細物件
  const [stopList, setStopList] = useState([]); // 路線的站點列表
  const [isLoading, setIsLoading] = useState(true); // 載入狀態，初始為true
  const [loadingProgress, setLoadingProgress] = useState(""); // 載入進度訊息

  // 輔助函數：帶重試機制的 fetch
  async function fetchWithRetry(url, retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: "application/json", // 添加請求頭，確保符合 API 要求
          },
        });
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

  // 獲取路線站點資料（支援 KMB 和城巴）
  async function fetchStopData(route, service_type, bound, company) {
    const mappedBound = bound === "O" ? "outbound" : "inbound";
    const expectedDir = bound; // 預期的 dir 值（"O" 或 "I"），城巴 API 使用 "O" 和 "I"
    let url;
    if (company === "KMB") {
      url = `${baseURLs.KMB}/route-stop/${route}/${mappedBound}/${service_type}`;
    } else {
      url = `${baseURLs.CTB}/route-stop/CTB/${route}/${mappedBound}`;
    }
    try {
      const response = await fetchWithRetry(url);
      console.log(
        `路線站點資料 (路線: ${route}, 公司: ${company}, 方向: ${mappedBound}):`,
        response
      );

      let filteredData = response.data;

      // 僅對城巴數據進行方向過濾（九巴數據不需要，因為方向已由 URL 確定）
      if (company === "CTB") {
        filteredData = response.data.filter((stop) => {
          const actualDir = stop.dir;
          console.log(`站點 ${stop.stop} 的 dir 值: ${actualDir}`); // 檢查 dir 值
          return actualDir === expectedDir;
        });
      }

      if (filteredData.length === 0) {
        console.warn(`警告：路線 ${route} 在方向 ${mappedBound} 下無匹配站點`);
      }
      return filteredData;
    } catch (error) {
      console.error(
        `Error fetching stop data for route ${route} (公司: ${company}, ${mappedBound}):`,
        error.message
      );
      return [];
    }
  }

  // 獲取單個城巴站點資料
  async function fetchCtbStop(stopId) {
    const url = `${baseURLs.CTB}/stop/${stopId}`;
    try {
      const response = await fetchWithRetry(url);
      console.log(`城巴站點資料 (站點: ${stopId}):`, response);
      return response.data || null;
    } catch (error) {
      console.error(
        `Error fetching stop data for stop ${stopId}:`,
        error.message
      );
      return null;
    }
  }

  // 初次載入時獲取 KMB 和城巴的路線資料
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true); // 開始載入
      setLoadingProgress("載入路線資料..."); // 顯示載入進度
      try {
        // 並行請求 KMB 和城巴的路線資料
        const [kmbRouteResults, ctbRouteResults] = await Promise.all([
          fetchWithRetry(`${baseURLs.KMB}/route`).catch((error) => {
            console.error("KMB 路線資料獲取失敗:", error.message);
            return { data: [] };
          }),
          fetchWithRetry(`${baseURLs.CTB}/route/CTB`).catch((error) => {
            console.error("城巴路線資料獲取失敗:", error.message);
            return { data: [] };
          }),
        ]);

        // 記錄 API 回應，便於調試
        console.log("K-routes:", kmbRouteResults);
        console.log("CTB-routes:", ctbRouteResults);

        // 為 KMB 路線添加公司標識
        const kmbRoutes = kmbRouteResults.data.map((route) => ({
          ...route,
          company: "KMB",
        }));

        // 為城巴路線添加公司標識
        const ctbRoutes = ctbRouteResults.data.map((route) => ({
          ...route,
          company: "CTB",
          service_type: "1", // 城巴 API 不需要 service_type，設置為默認值
        }));

        // 合併 KMB 和城巴的路線
        const combinedRoutes = [...kmbRoutes, ...ctbRoutes];

        setAllRoutes(combinedRoutes);

        // 獲取 KMB 站點資料
        setLoadingProgress("載入KMB站點資料..."); // 更新載入進度
        const kmbStopResults = await fetchWithRetry(
          `${baseURLs.KMB}/stop`
        ).catch((error) => {
          console.error("KMB 站點資料獲取失敗:", error.message);
          return { data: [] };
        });
        console.log("K-stops:", kmbStopResults);
        const kmbStops = kmbStopResults.data.map((stop) => ({
          ...stop,
          company: "KMB",
        }));

        setAllStops(kmbStops);

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
      const { route, service_type, bound, company } = selectedRouteObj;
      // 確保 route、service_type、bound、company 存在
      if (!route || !bound || !company) {
        console.log("無效路線物件，跳過fetchRouteStop:", selectedRouteObj);
        return;
      }

      setIsLoading(true); // 開始載入站點
      setLoadingProgress("載入站點資料..."); // 更新載入進度
      try {
        const stopData = await fetchStopData(
          route,
          service_type,
          bound,
          company
        );
        if (stopData.length === 0) {
          throw new Error(
            `該路線 (${route}) 在此方向 (${
              bound === "O" ? "去線" : "回線"
            }) 無站點資料，請確認路線資訊`
          );
        }
        setStopList(stopData);

        // 如果是城巴路線，載入相關站點資料
        if (company === "CTB") {
          setLoadingProgress("載入城巴站點資料..."); // 更新載入進度
          const stopIds = new Set(stopData.map((stop) => stop.stop));
          const stopPromises = Array.from(stopIds).map(async (stopId) => {
            const stopData = await fetchCtbStop(stopId);
            if (stopData) {
              return { ...stopData, company: "CTB", stop: stopId }; // 確保 stop 字段一致
            }
            return null;
          });
          const ctbStopsData = (await Promise.all(stopPromises)).filter(
            (stop) => stop !== null
          );
          console.log("城巴站點資料更新:", ctbStopsData);
          setAllStops((prevStops) => {
            // 避免重複添加相同的站點
            const existingStopIds = new Set(prevStops.map((stop) => stop.stop));
            const newStops = ctbStopsData.filter(
              (stop) => !existingStopIds.has(stop.stop)
            );
            return [...prevStops, ...newStops];
          });
        }

        setErrorMsg(""); // 清除錯誤
      } catch (error) {
        console.error("獲取路線站點失敗:", error.message, error.stack);
        setErrorMsg(error.message || "無法載入站點資料，請稍後重試");
        setStopList([]); // 清空站點列表
      } finally {
        setIsLoading(false); // 結束載入
      }
    }

    fetchRouteStop();
  }, [selectedRouteObj]); // 依賴 selectedRouteObj

  // 檢查用戶輸入的路線是否存在（支援 KMB 和城巴）
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
        <p className="text-rose-600">{loadingProgress}</p> {/* 顯示載入進度 */}
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
          className="border bg-[#999999] border-[#111111] py-2 px-4 rounded-md w-[200px] text-center mx-auto mt-4 z-0"
        >
          {errorMsg}
        </p>
      )}
      {/* 顯示站點載入提示 */}
      {isLoading && stopList.length > 0 && (
        <p className="text-center text-rose-600 mt-4 z-0">{loadingProgress}</p>
      )}
      {/* 顯示路線方向選擇 */}
      {selectedRoute.length > 0 && (
        <BoundContainer
          routeArr={selectedRoute}
          selectRouteObj={setSelectedRouteObj}
        />
      )}
      {/* 顯示站點列表，傳遞 bound 和 company 資訊 */}
      <StopList
        stopListArr={stopList}
        allStops={allStops}
        selectedBound={selectedRouteObj.bound}
        selectedCompany={selectedRouteObj.company}
      />
    </>
  );
}

export default App;
