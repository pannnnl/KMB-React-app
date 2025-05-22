import { useState, useEffect, useCallback, useRef } from "react";

function StopList({ stopListArr, allStops, selectedBound }) {
  // 狀態定義
  const [etaData, setEtaData] = useState({}); // 儲存每個站點的ETA資料，鍵為stop ID
  const [isLoading, setIsLoading] = useState(false); // ETA載入狀態
  const [expandedStop, setExpandedStop] = useState(null); // 當前展開的站點ID
  const [etaError, setEtaError] = useState(""); // ETA錯誤訊息
  const [currentTime, setCurrentTime] = useState(new Date()); // 用於即時更新畫面

  // 快取 ETA 結果，避免重複請求
  const etaCache = useRef({});

  // 輔助函數：帶超時機制的 fetch
  const fetchWithTimeout = async (url, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      if (!response.ok) {
        throw new Error(`HTTP錯誤: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  // 獲取單個站點的ETA，添加超時機制
  async function fetchETA(stopId, route, service_type) {
    const etaAPI = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${service_type}`;
    try {
      const results = await fetchWithTimeout(etaAPI);
      console.log(`ETA資料（站點：${stopId}）:`, results);
      return results.data;
    } catch (error) {
      console.error(`獲取ETA失敗（站點：${stopId}）:`, error.message);
      return null; // 返回 null 表示 API 錯誤
    }
  }

  // 獲取指定站點的ETA並更新狀態，使用 useCallback 確保穩定性
  const fetchETAForStop = useCallback(
    async (stopObj) => {
      const { stop, route, service_type } = stopObj;
      const cacheKey = `${stop}-${route}-${service_type}-${selectedBound}`;

      // 檢查快取
      if (etaCache.current[cacheKey]) {
        setEtaData((prev) => ({ ...prev, [stop]: etaCache.current[cacheKey] }));
        setIsLoading(false);
        return;
      }

      setIsLoading(true); // 開始載入
      setEtaError(""); // 清除舊錯誤
      const eta = await fetchETA(stop, route, service_type);
      if (eta === null) {
        setEtaError("無法獲取到站時間，請稍後重試"); // API 錯誤
        setEtaData((prev) => ({ ...prev, [stop]: [] }));
        setIsLoading(false);
        return;
      }

      // 根據 bound 過濾 eta 數據
      let filteredEta = eta.filter((e) => e.dir === selectedBound);

      // 按到達時間排序
      filteredEta.sort((a, b) => new Date(a.eta) - new Date(b.eta));

      etaCache.current[cacheKey] = filteredEta; // 儲存到快取
      setEtaData((prev) => ({
        ...prev,
        [stop]: filteredEta,
      }));
      setIsLoading(false); // 結束載入
    },
    [selectedBound]
  ); // 依賴 selectedBound

  // 定時更新展開站點的ETA（每15秒）
  useEffect(() => {
    if (expandedStop) {
      const stopObj = stopListArr.find((s) => s.stop === expandedStop);
      if (stopObj) {
        fetchETAForStop(stopObj); // 初次獲取ETA
        // 每15秒更新一次
        const interval = setInterval(() => {
          console.log(`更新ETA（站點：${expandedStop}）`);
          fetchETAForStop(stopObj);
        }, 15000); // 縮短到15秒
        // 清理計時器，防止記憶體洩漏
        return () => clearInterval(interval);
      }
    }
  }, [expandedStop, stopListArr, fetchETAForStop]);

  // 即時更新畫面上的 ETA 列表（每5秒）
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date()); // 每5秒更新當前時間，觸發重新渲染
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 處理站點點擊，展開或收起
  const handleStopClick = (stopId, stopObj) => {
    if (expandedStop === stopId) {
      setExpandedStop(null); // 點擊已展開的站點，收起
      setEtaError(""); // 清除錯誤
    } else {
      setExpandedStop(stopId); // 展開新站點
      if (!etaData[stopId]) {
        fetchETAForStop(stopObj); // 如果無ETA資料，獲取
      }
    }
  };

  // 渲染站點列表
  return (
    <div
      id="stopListContainer"
      className="flex justify-center flex-col items-center mt-8"
    >
      {stopListArr.length > 0 &&
        stopListArr.map((stopObj) => {
          const { seq, stop } = stopObj; // 移除未使用的 bound, route, service_type
          const stopArrWithName = allStops.filter((s) => s.stop === stop);
          const isExpanded = expandedStop === stop; // 是否展開當前站點
          const eta = etaData[stop] || []; // 當前站點的ETA資料

          // 判斷是否為頭站或尾站
          const isHeadOrTailStation = seq === 1 || seq === stopListArr.length;

          // 計算最近3班車的ETA和剩餘分鐘
          const nextETAs =
            eta.length > 0
              ? eta
                  .filter((e) => {
                    if (!e.eta) return false;
                    const etaTime = new Date(e.eta);
                    return etaTime >= currentTime; // 過濾已過期的班次
                  })
                  .slice(0, 3)
                  .map((e) => {
                    const etaTime = new Date(e.eta);
                    const minutes = Math.round(
                      (etaTime - currentTime) / 1000 / 60
                    ); // 使用 currentTime 計算
                    const timeStr = etaTime.toLocaleTimeString("zh-HK", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return {
                      time: timeStr,
                      minutes: minutes > 0 ? `${minutes}分鐘` : "即將到達",
                    };
                  })
              : [{ time: "無車", minutes: "-" }]; // 當 eta 為空時顯示「無車」

          return (
            <div
              className="py-2 px-4 cursor-pointer flex flex-col border border-rose-500 w-[300px] rounded-md mb-4 hover:bg-rose-100"
              key={stop}
              onClick={() => handleStopClick(stop, stopObj)}
            >
              {/* 站點名稱和展開/收起按鈕 */}
              <div className="flex justify-between items-center">
                <span>
                  {seq} - {stopArrWithName[0]?.name_tc || "未知站點"}
                  {isHeadOrTailStation && " (頭尾站)"}
                </span>
                <span className="text-rose-600 text-sm">
                  {isExpanded ? "" : ""}
                </span>
              </div>
              {/* 展開時顯示ETA */}
              {isExpanded && (
                <div className="mt-2 text-sm text-rose-600">
                  {isLoading ? (
                    <div>載入中...</div>
                  ) : etaError ? (
                    <div>{etaError}</div>
                  ) : (
                    <div>
                      {nextETAs.map((eta, index) => (
                        <div key={index}>
                          {eta.time === "無車"
                            ? "無車"
                            : `第${index + 1}班: ${eta.time} ${
                                eta.minutes !== "-" && `(${eta.minutes})`
                              }`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

export default StopList;
