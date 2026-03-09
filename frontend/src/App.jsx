import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://127.0.0.1:5000";
const POLL_MS  = 3000;

const Icons = {
  Shield:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Alert:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Kill:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Zap:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Eye:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:18,height:18}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

function StatCard({ icon: I, label, value, color = "#22d3ee", pulse }) {
  return (
    <div style={{
      background:"linear-gradient(135deg,#0f172a,#1e293b)",
      border:`1px solid ${color}25`, borderRadius:12, padding:"20px 24px",
      position:"relative", overflow:"hidden", flex:1,
    }}>
      <div style={{position:"absolute",top:0,right:0,width:80,height:80,
        background:`radial-gradient(circle,${color}20,transparent 70%)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{color,background:`${color}15`,padding:8,borderRadius:8,display:"flex",
          animation:pulse?"pulse 2s infinite":"none"}}><I/></div>
        <span style={{color:"#64748b",fontSize:11,fontWeight:600,letterSpacing:"0.06em",
          textTransform:"uppercase"}}>{label}</span>
      </div>
      <div style={{color:"#f1f5f9",fontSize:36,fontWeight:900,letterSpacing:"-2px",
        fontFamily:"monospace"}}>{value ?? "—"}</div>
    </div>
  );
}

function AlertRow({ alert, i }) {
  const isRansom = alert.label==="ransomware"||alert.type==="process_killed"||(alert.ransomware_prob>0.7);
  const prob = alert.probability??alert.ransomware_prob??0;
  const ts = (alert.received_at||alert.timestamp)
    ? new Date(alert.received_at||alert.timestamp).toLocaleTimeString() : "—";
  return (
    <div style={{
      background:isRansom?"linear-gradient(90deg,#7f1d1d20,transparent)":"#0f172a",
      border:`1px solid ${isRansom?"#ef444430":"#1e293b"}`,
      borderRadius:8,padding:"12px 16px",
      display:"flex",alignItems:"center",gap:12,
      animation:i===0?"fadeIn 0.4s ease":"none",
    }}>
      <span style={{
        background:isRansom?"#7f1d1d":"#14532d",
        border:`1px solid ${isRansom?"#ef4444":"#22c55e"}`,
        color:isRansom?"#fca5a5":"#86efac",
        padding:"2px 8px",borderRadius:4,
        fontSize:10,fontWeight:800,letterSpacing:"0.05em",
        fontFamily:"monospace",whiteSpace:"nowrap",
      }}>{isRansom?"RANSOMWARE":"BENIGN"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#f1f5f9",fontSize:13,fontWeight:600}}>
          {alert.process_name||alert.file||"Detection Event"}
          {alert.pid&&<span style={{color:"#64748b",fontWeight:400,marginLeft:8}}>PID {alert.pid}</span>}
        </div>
        {alert.action_taken&&<div style={{color:"#94a3b8",fontSize:11,marginTop:2}}>
          Action: <span style={{color:"#fca5a5"}}>{alert.action_taken}</span>
        </div>}
      </div>
      {prob>0&&<div style={{color:isRansom?"#ef4444":"#22c55e",fontWeight:800,fontSize:14,
        fontFamily:"monospace"}}>{Math.round(prob*100)}%</div>}
      <div style={{color:"#475569",fontSize:11,whiteSpace:"nowrap"}}>{ts}</div>
    </div>
  );
}

function PredictPanel() {
  const FIELDS = [
    ["lba","LBA (Disk Address)"],["size","I/O Size (bytes)"],
    ["flags","Flags"],["duration","Duration (µs)"],
    ["queue_depth","Queue Depth"],["throughput","Throughput (B/s)"],
  ];
  const [vals,setVals]     = useState({lba:100000,size:4096,flags:1,duration:200,queue_depth:2,throughput:10000});
  const [result,setResult] = useState(null);
  const [loading,setLoading] = useState(false);

  const loadPreset = (type) => {
    if (type==="ransom") setVals({lba:999999999,size:999999,flags:255,duration:999999,queue_depth:32,throughput:99999999});
    else setVals({lba:100000,size:4096,flags:1,duration:200,queue_depth:2,throughput:10000});
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/predict`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify(vals),
      });
      const d = await r.json();
      setResult(d.data);
    } catch { setResult({error:"Cannot connect to backend. Run: python backend/app.py"}); }
    setLoading(false);
  };

  const isRansom = result?.label==="ransomware";
  const pct = Math.round((result?.probability||0)*100);

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,width:"100%"}}>
      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:24}}>
        <div style={{color:"#94a3b8",fontSize:11,letterSpacing:"0.1em",
          textTransform:"uppercase",marginBottom:16}}>RanSAP Disk I/O Features</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <button onClick={()=>loadPreset("ransom")} style={{
            background:"#7f1d1d",border:"1px solid #ef4444",color:"#fca5a5",
            padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}}>
            🔴 Load Ransomware
          </button>
          <button onClick={()=>loadPreset("benign")} style={{
            background:"#14532d",border:"1px solid #22c55e",color:"#86efac",
            padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:700}}>
            🟢 Load Benign
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {FIELDS.map(([key,label])=>(
            <div key={key}>
              <label style={{color:"#64748b",fontSize:11,display:"block",marginBottom:4}}>{label}</label>
              <input type="number" value={vals[key]}
                onChange={e=>setVals(v=>({...v,[key]:parseFloat(e.target.value)||0}))}
                style={{width:"100%",background:"#020617",border:"1px solid #1e293b",
                  borderRadius:6,padding:"6px 10px",color:"#f1f5f9",fontSize:13,
                  outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
            </div>
          ))}
        </div>
        <button onClick={handlePredict} disabled={loading} style={{
          width:"100%",
          background:loading?"#1e293b":"linear-gradient(135deg,#1d4ed8,#7c3aed)",
          color:"#fff",border:"none",borderRadius:8,padding:"12px",
          cursor:loading?"not-allowed":"pointer",
          fontWeight:700,fontSize:14,letterSpacing:"0.05em",fontFamily:"monospace",
          transition:"opacity 0.2s",
        }}>{loading?"ANALYZING...":"▶ RUN LSTM MODEL"}</button>
      </div>

      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:12,padding:24}}>
        <div style={{color:"#94a3b8",fontSize:11,letterSpacing:"0.1em",
          textTransform:"uppercase",marginBottom:16}}>Model Output</div>
        {!result?(
          <div style={{color:"#334155",textAlign:"center",padding:"60px 0",fontSize:13}}>
            Submit features to see LSTM prediction
          </div>
        ):result.error?(
          <div style={{color:"#fcd34d",background:"#78350f30",border:"1px solid #f59e0b30",
            borderRadius:8,padding:16,fontSize:13}}>{result.error}</div>
        ):(
          <div style={{borderRadius:10,padding:24,height:"calc(100% - 40px)",
            background:isRansom?"linear-gradient(135deg,#7f1d1d40,#0f172a)"
                                :"linear-gradient(135deg,#14532d40,#0f172a)",
            border:`1px solid ${isRansom?"#ef444450":"#22c55e50"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
              <div style={{fontSize:56,fontWeight:900,fontFamily:"monospace",
                color:isRansom?"#ef4444":"#22c55e",lineHeight:1}}>{pct}%</div>
              <div>
                <div style={{fontWeight:800,fontSize:20,
                  color:isRansom?"#fca5a5":"#86efac"}}>
                  {isRansom?"🚨 RANSOMWARE":"✅ BENIGN"}
                </div>
                <div style={{color:"#64748b",fontSize:12,marginTop:4}}>
                  Confidence: {Math.round((result.confidence||0)*100)}%
                </div>
                <div style={{color:"#64748b",fontSize:12}}>
                  Threshold: {(result.threshold||0.7)*100}%
                </div>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",
                fontSize:11,color:"#64748b",marginBottom:6}}>
                <span>Ransomware Probability</span>
                <span style={{color:isRansom?"#ef4444":"#22c55e",fontWeight:700}}>{pct}%</span>
              </div>
              <div style={{height:10,background:"#1e293b",borderRadius:5,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:5,
                  background:isRansom?"linear-gradient(90deg,#ef4444,#dc2626)"
                                     :"linear-gradient(90deg,#22c55e,#16a34a)",
                  transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow:`0 0 12px ${isRansom?"#ef444480":"#22c55e80"}`}}/>
              </div>
            </div>
            <div style={{color:"#334155",fontSize:11,fontFamily:"monospace",marginTop:12}}>
              LSTM (100×6) · RanSAP 2022 · Cerber Family
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [tab,setTab]           = useState("dashboard");
  const [status,setStatus]     = useState(null);
  const [alerts,setAlerts]     = useState([]);
  const [backendOk,setBackendOk] = useState(null);
  const [lastUpd,setLastUpd]   = useState(null);
  const timer = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [mon,alr] = await Promise.all([
        fetch(`${API_BASE}/monitor`).then(r=>r.json()),
        fetch(`${API_BASE}/alerts?limit=20`).then(r=>r.json()),
      ]);
      if (mon.success) setStatus(mon.data);
      if (alr.success) setAlerts(alr.data.alerts||[]);
      setBackendOk(true);
      setLastUpd(new Date().toLocaleTimeString());
    } catch { setBackendOk(false); }
  },[]);

  useEffect(()=>{
    fetchData();
    timer.current = setInterval(fetchData,POLL_MS);
    return ()=>clearInterval(timer.current);
  },[fetchData]);

  const TABS = [
    {id:"dashboard",label:"Dashboard",icon:Icons.Shield},
    {id:"alerts",   label:"Alerts",   icon:Icons.Alert},
    {id:"predict",  label:"Predict",  icon:Icons.Zap},
    {id:"monitor",  label:"Monitor",  icon:Icons.Eye},
  ];

  return (
    <div style={{
      minHeight:"100vh",width:"100vw",
      background:"linear-gradient(160deg,#020617 0%,#0a1628 50%,#020617 100%)",
      fontFamily:"'IBM Plex Mono','Fira Code',monospace",
      color:"#e2e8f0",overflowX:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0;padding:0;overflow-x:hidden}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:2px}
        input:focus{border-color:#38bdf8!important}
        button:hover{opacity:0.85}
      `}</style>

      {/* SCANLINE EFFECT */}
      <div style={{
        position:"fixed",top:0,left:0,width:"100%",height:"2px",
        background:"linear-gradient(90deg,transparent,#38bdf820,transparent)",
        animation:"scanline 4s linear infinite",pointerEvents:"none",zIndex:999,
      }}/>

      {/* HEADER */}
      <div style={{
        borderBottom:"1px solid #0f172a",
        background:"rgba(2,6,23,0.97)",
        backdropFilter:"blur(20px)",
        position:"sticky",top:0,zIndex:100,width:"100%",
      }}>
        <div style={{
          width:"100%",padding:"0 40px",
          display:"flex",alignItems:"center",height:64,gap:20,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{
              background:"linear-gradient(135deg,#ef4444,#7c3aed)",
              padding:9,borderRadius:9,color:"#fff",display:"flex",
              boxShadow:"0 0 20px #ef444440",
            }}><Icons.Shield/></div>
            <div>
              <div style={{fontWeight:800,fontSize:15,letterSpacing:"0.12em",
                color:"#f1f5f9"}}>RANSOMGUARD</div>
              <div style={{fontSize:9,color:"#334155",letterSpacing:"0.1em"}}>
                RanSAP 2022 · CERBER · LSTM DETECTION
              </div>
            </div>
          </div>

          <div style={{flex:1}}/>

          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:tab===t.id?"#1e293b":"transparent",
              border:tab===t.id?"1px solid #334155":"1px solid transparent",
              color:tab===t.id?"#f1f5f9":"#475569",
              padding:"7px 16px",borderRadius:7,cursor:"pointer",
              fontSize:12,fontWeight:600,letterSpacing:"0.03em",
              display:"flex",alignItems:"center",gap:7,
              transition:"all 0.15s",
            }}><t.icon/>{t.label}</button>
          ))}

          <div style={{
            display:"flex",alignItems:"center",gap:8,
            background:"#0f172a",border:"1px solid #1e293b",
            padding:"6px 12px",borderRadius:20,
          }}>
            <div style={{
              width:7,height:7,borderRadius:"50%",
              background:backendOk===null?"#f59e0b":backendOk?"#22c55e":"#ef4444",
              boxShadow:`0 0 8px ${backendOk===null?"#f59e0b":backendOk?"#22c55e":"#ef4444"}`,
              animation:backendOk?"pulse 2s infinite":"none",
            }}/>
            <span style={{fontSize:10,color:"#64748b",letterSpacing:"0.05em"}}>
              {backendOk===null?"CONNECTING":backendOk?"LIVE":"OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{width:"100%",padding:"32px 40px",minHeight:"calc(100vh - 64px)"}}>

        {backendOk===false&&(
          <div style={{
            background:"#78350f20",border:"1px solid #f59e0b40",
            borderRadius:10,padding:"14px 20px",marginBottom:24,
            color:"#fcd34d",fontSize:13,display:"flex",alignItems:"center",gap:12,
          }}>
            ⚠️ Backend offline —
            <code style={{background:"#0f172a",padding:"3px 10px",
              borderRadius:5,color:"#94a3b8"}}>python backend/app.py</code>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:24}}>
            <div>
              <h1 style={{fontSize:26,fontWeight:800,color:"#f1f5f9",
                letterSpacing:"-0.5px"}}>System Dashboard</h1>
              <p style={{color:"#334155",fontSize:13,marginTop:4}}>
                RanSAP 2022 · Cerber Family · Real-time LSTM Detection
                {lastUpd&&<span style={{color:"#1e293b",marginLeft:12}}>· {lastUpd}</span>}
              </p>
            </div>

            {/* STAT CARDS */}
            <div style={{display:"flex",gap:16,width:"100%"}}>
              <StatCard icon={Icons.Alert}    label="Detections"  value={status?.ransomware_detections??0} color="#ef4444" pulse={status?.ransomware_detections>0}/>
              <StatCard icon={Icons.Activity} label="Predictions" value={status?.total_predictions??0}     color="#38bdf8"/>
              <StatCard icon={Icons.Kill}     label="Proc Killed" value={status?.processes_killed??0}      color="#f59e0b"/>
              <StatCard icon={Icons.Database} label="Alerts"      value={status?.alert_count??0}           color="#a855f7"/>
            </div>

            {/* STATUS + ALERTS */}
            <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:20,width:"100%"}}>
              <div style={{background:"#0f172a",border:"1px solid #1e293b",
                borderRadius:12,padding:24}}>
                <div style={{color:"#475569",fontSize:10,letterSpacing:"0.12em",
                  textTransform:"uppercase",marginBottom:20,
                  borderBottom:"1px solid #1e293b",paddingBottom:10}}>
                  Engine Status
                </div>
                {[
                  ["Status",    status?.engine_status??"unknown"],
                  ["Watch Dir", status?.watch_directory??"test_folder"],
                  ["Model",     status?.model??"ransomware_lstm_model.keras"],
                  ["Dataset",   status?.dataset??"RanSAP 2022 (Cerber)"],
                  ["Window",    `${status?.window_size??100} events`],
                  ["Threshold", `${(status?.threshold??0.7)*100}%`],
                  ["Uptime",    status?.uptime_secs?`${Math.floor(status.uptime_secs/60)}m ${Math.floor(status.uptime_secs%60)}s`:"—"],
                ].map(([k,v])=>(
                  <div key={k} style={{
                    display:"flex",justifyContent:"space-between",alignItems:"center",
                    padding:"10px 0",borderBottom:"1px solid #0f172a",fontSize:13,
                  }}>
                    <span style={{color:"#475569"}}>{k}</span>
                    <span style={{
                      color: k==="Status"
                        ? (v==="running"?"#22c55e":"#ef4444")
                        : "#64748b",
                      fontFamily:"monospace",fontSize:12,
                      background:"#020617",padding:"2px 8px",borderRadius:4,
                    }}>{String(v)}</span>
                  </div>
                ))}
              </div>

              <div style={{background:"#0f172a",border:"1px solid #1e293b",
                borderRadius:12,padding:24}}>
                <div style={{color:"#475569",fontSize:10,letterSpacing:"0.12em",
                  textTransform:"uppercase",marginBottom:20,
                  borderBottom:"1px solid #1e293b",paddingBottom:10,
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>Recent Alerts</span>
                  {alerts.length>0&&<span style={{color:"#ef4444",fontSize:10}}>
                    {alerts.length} total
                  </span>}
                </div>
                {alerts.length===0?(
                  <div style={{
                    color:"#22c55e",textAlign:"center",padding:"50px 0",fontSize:13,
                    display:"flex",flexDirection:"column",alignItems:"center",gap:10,
                  }}>
                    <div style={{fontSize:32}}>✅</div>
                    No ransomware activity detected
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8,
                    maxHeight:320,overflowY:"auto"}}>
                    {alerts.slice(0,6).map((a,i)=><AlertRow key={i} alert={a} i={i}/>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {tab==="alerts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h1 style={{fontSize:24,fontWeight:800,color:"#f1f5f9"}}>Alert Log</h1>
                <p style={{color:"#334155",fontSize:13,marginTop:4}}>
                  All detection events from the LSTM engine
                </p>
              </div>
              <button onClick={async()=>{
                await fetch(`${API_BASE}/alerts/clear`,{method:"DELETE"});
                setAlerts([]);
              }} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",
                padding:"8px 16px",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:600}}>
                Clear All
              </button>
            </div>
            {alerts.length===0?(
              <div style={{color:"#22c55e",textAlign:"center",padding:80,
                background:"#0f172a",borderRadius:12,border:"1px solid #14532d30",fontSize:14}}>
                ✅ No alerts. System is clean.
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {alerts.map((a,i)=><AlertRow key={i} alert={a} i={i}/>)}
              </div>
            )}
          </div>
        )}

        {/* ── PREDICT ── */}
        {tab==="predict"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:"#f1f5f9"}}>LSTM Prediction</h1>
              <p style={{color:"#334155",fontSize:13,marginTop:4}}>
                Submit RanSAP disk I/O features directly to the trained model
              </p>
            </div>
            <PredictPanel/>
          </div>
        )}

        {/* ── MONITOR ── */}
        {tab==="monitor"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:"#f1f5f9"}}>Live Monitor</h1>
              <p style={{color:"#334155",fontSize:13,marginTop:4}}>
                Real-time system statistics from the backend
              </p>
            </div>
            <div style={{background:"#0f172a",border:"1px solid #1e293b",
              borderRadius:12,padding:24}}>
              {status?(
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
                  {Object.entries(status)
                    .filter(([k])=>k!=="recent_alerts")
                    .map(([k,v])=>(
                      <div key={k} style={{background:"#020617",borderRadius:8,
                        padding:"14px 18px",border:"1px solid #1e293b"}}>
                        <div style={{color:"#334155",fontSize:10,marginBottom:6,
                          textTransform:"uppercase",letterSpacing:"0.08em"}}>{k}</div>
                        <div style={{color:"#64748b",fontFamily:"monospace",
                          fontSize:14,wordBreak:"break-all",fontWeight:600}}>
                          {String(v)}
                        </div>
                      </div>
                    ))}
                </div>
              ):(
                <div style={{color:"#334155",textAlign:"center",padding:60,fontSize:13}}>
                  Connecting to backend...
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}