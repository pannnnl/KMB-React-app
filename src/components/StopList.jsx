import { useState, useEffect } from "react";

function StopList({ stopListArr, allStops }) {
  // 狀態定義
  const [etaData, setEtaData] = useState({}); // 儲存每個站點的ETA資料，鍵為stop ID
  const [isLoading, setIsLoading] = useState(false); // ETA載入狀態
  const [expandedStop, setExpandedStop] = useState(null); // 當前展開的站點ID
  const [etaError, setEtaError] = useState(""); // ETA錯誤訊息

  // 輔助函數：獲取單個站點的ETA
  async function fetchETA(stopId, route, service_type) {
    const etaAPI = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stopId}/${route}/${service_type}`;
    try {
      const res = await fetch(etaAPI);
      if (!res.ok) {
        throw new Error(`ETA API失敗: ${res.status} ${res.statusText}`);
      }
      const results = await res.json();
      console.log(`ETA資料（站點：${stopId}）:`, results);
      return results.data;
    } catch (error) {
      console.error(`獲取ETA失敗（站點：${stopId}）:`, error.message);
      return []; // 返回空陣列作為備用
    }
  }

  // 獲取指定站點的ETA並更新狀態
  const fetchETAForStop = async (stopObj) => {
    const { stop, route, service_type } = stopObj;
    setIsLoading(true); // 開始載入
    setEtaError(""); // 清除舊錯誤
    const eta = await fetchETA(stop, route, service_type);
    if (eta.length === 0) {
      setEtaError("無法獲取到站時間，請稍後重試"); // 無資料時設置錯誤
    }
    setEtaData((prev) => ({
      ...prev,
      [stop]: eta,
    }));
    setIsLoading(false); // 結束載入
  };

  // 定時更新展開站點的ETA
  useEffect(() => {
    if (expandedStop) {
      const stopObj = stopListArr.find((s) => s.stop === expandedStop);
      if (stopObj) {
        fetchETAForStop(stopObj); // 初次獲取ETA
        // 每30秒更新一次
        const interval = setInterval(() => {
          console.log(`更新ETA（站點：${expandedStop}）`);
          fetchETAForStop(stopObj);
        }, 30000);
        // 清理計時器，防止記憶體洩漏
        return () => clearInterval(interval);
      }
    }
  }, [expandedStop, stopListArr]); // 當expandedStop或stopListArr改變時執行

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
          const { bound, route, seq, service_type, stop } = stopObj;
          const stopArrWithName = allStops.filter((s) => s.stop === stop);
          const isExpanded = expandedStop === stop; // 是否展開當前站點
          const eta = etaData[stop] || []; // 當前站點的ETA資料

          // 計算最近3班車的ETA和剩餘分鐘
          const nextETAs =
            eta.length > 0
              ? eta.slice(0, 3).map((e) => {
                  if (!e.eta) {
                    return { time: "無", minutes: "-" };
                  }
                  const etaTime = new Date(e.eta);
                  const now = new Date();
                  const minutes = Math.round((etaTime - now) / 1000 / 60); // 計算分鐘差
                  const timeStr = etaTime.toLocaleTimeString("zh-HK", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return {
                    time: timeStr,
                    minutes: minutes > 0 ? `${minutes}分鐘` : "即將到達",
                  };
                })
              : [{ time: "無即將到站", minutes: "-" }];

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
                          第{index + 1}班: {eta.time}{" "}
                          {eta.minutes !== "-" && `(${eta.minutes})`}
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
