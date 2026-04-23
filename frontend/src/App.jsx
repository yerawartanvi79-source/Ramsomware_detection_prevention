import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://127.0.0.1:5000";
const POLL_MS  = 3000;

const Icons = {
  Shield:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Alert:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Kill:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Zap:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Eye:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:20,height:20}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ArrowRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

function StatCard({ icon: I, label, value, color, pulse }) {
  return (
    <div style={{
      background:color==="red"?"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))":
                  color==="blue"?"linear-gradient(135deg,rgba(59,130,246,0.15),rgba(59,130,246,0.05))":
                  color==="orange"?"linear-gradient(135deg,rgba(249,115,22,0.15),rgba(249,115,22,0.05))":
                  "linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))",
      border:`2px solid ${color==="red"?"rgba(239,68,68,0.3)":color==="blue"?"rgba(59,130,246,0.3)":color==="orange"?"rgba(249,115,22,0.3)":"rgba(99,102,241,0.3)"}`,
      borderRadius:16,
      padding:"32px",
      flex:1,
      minWidth:"200px",
      boxShadow:"0 8px 32px rgba(0,0,0,0.1)",
      transition:"all 0.3s ease",
      backdropFilter:"blur(10px)",
      position:"relative",
      overflow:"hidden",
    }}>
      <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:color==="red"?"rgba(239,68,68,0.1)":color==="blue"?"rgba(59,130,246,0.1)":color==="orange"?"rgba(249,115,22,0.1)":"rgba(99,102,241,0.1)",borderRadius:"50%",filter:"blur(40px)"}}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,position:"relative",zIndex:1}}>
        <div style={{
          color:color==="red"?"#ef4444":color==="blue"?"#3b82f6":color==="orange"?"#f97316":"#6366f1",
          background:color==="red"?"rgba(239,68,68,0.2)":color==="blue"?"rgba(59,130,246,0.2)":color==="orange"?"rgba(249,115,22,0.2)":"rgba(99,102,241,0.2)",
          padding:12,
          borderRadius:12,
          display:"flex",
          animation:pulse?"pulse 2s infinite":"none"
        }}><I/></div>
        <span style={{color:"#64748b",fontSize:13,fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}</span>
      </div>
      <div style={{color:"#1e293b",fontSize:44,fontWeight:900,letterSpacing:"-2px",position:"relative",zIndex:1}}>{value ?? "—"}</div>
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
      background:isRansom?"linear-gradient(90deg,rgba(239,68,68,0.1),transparent)":"linear-gradient(90deg,rgba(34,197,94,0.1),transparent)",
      border:`1.5px solid ${isRansom?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)"}`,
      borderRadius:12,padding:"16px 20px",
      display:"flex",alignItems:"center",gap:14,
      animation:`slideInUp ${0.3 + i*0.05}s ease`,
    }}>
      <span style={{
        background:isRansom?"#ef4444":"#22c55e",
        color:"#ffffff",
        padding:"6px 12px",borderRadius:6,
        fontSize:11,fontWeight:800,letterSpacing:"0.05em",
        whiteSpace:"nowrap",
      }}>{isRansom?"THREAT":"SAFE"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#1e293b",fontSize:14,fontWeight:700}}>
          {alert.process_name||alert.file||"Detection Event"}
          {alert.pid&&<span style={{color:"#64748b",fontWeight:500,marginLeft:10}}>#{alert.pid}</span>}
        </div>
        {alert.action_taken&&<div style={{color:"#64748b",fontSize:12,marginTop:4}}>
          <span style={{opacity:0.7}}>Action: </span><span style={{color:"#ef4444",fontWeight:700}}>{alert.action_taken}</span>
        </div>}
      </div>
      {prob>0&&<div style={{color:isRansom?"#ef4444":"#22c55e",fontWeight:900,fontSize:16}}>{Math.round(prob*100)}%</div>}
      <div style={{color:"#94a3b8",fontSize:12,whiteSpace:"nowrap"}}>{ts}</div>
    </div>
  );
}

function PredictPanel() {
  const FIELDS = [
    ["lba","Disk Address"],["size","I/O Size"],
    ["flags","Flags"],["duration","Duration (µs)"],
    ["queue_depth","Queue Depth"],["throughput","Throughput"],
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
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,width:"100%"}}>
      <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}>
        <div style={{color:"#64748b",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:20,fontWeight:800}}>Input Features - RanSAP Dataset</div>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <button onClick={()=>loadPreset("ransom")} style={{
            background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",color:"#ffffff",
            padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,
            transition:"all 0.2s",boxShadow:"0 4px 12px rgba(239,68,68,0.3)",flex:1
          }}>
            🔴 Ransomware
          </button>
          <button onClick={()=>loadPreset("benign")} style={{
            background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",color:"#ffffff",
            padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,
            transition:"all 0.2s",boxShadow:"0 4px 12px rgba(34,197,94,0.3)",flex:1
          }}>
            🟢 Benign
          </button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          {FIELDS.map(([key,label])=>(
            <div key={key}>
              <label style={{color:"#334155",fontSize:12,display:"block",marginBottom:8,fontWeight:700}}>{label}</label>
              <input type="number" value={vals[key]}
                onChange={e=>setVals(v=>({...v,[key]:parseFloat(e.target.value)||0}))}
                style={{width:"100%",background:"rgba(255,255,255,0.8)",border:"1.5px solid rgba(199,210,254,0.4)",
                  borderRadius:10,padding:"10px 14px",color:"#1e293b",fontSize:13,
                  outline:"none",boxSizing:"border-box",transition:"all 0.2s",fontWeight:600}}
                onFocus={e => {e.target.style.borderColor = "rgba(59,130,246,0.8)"; e.target.style.background = "#ffffff"}}
                onBlur={e => {e.target.style.borderColor = "rgba(199,210,254,0.4)"; e.target.style.background = "rgba(255,255,255,0.8)"}}
              />
            </div>
          ))}
        </div>
        <button onClick={handlePredict} disabled={loading} style={{
          width:"100%",
          background:loading?"#cbd5e1":"linear-gradient(135deg,#3b82f6,#2563eb)",
          color:"#ffffff",border:"none",borderRadius:12,padding:"14px",
          cursor:loading?"not-allowed":"pointer",
          fontWeight:800,fontSize:15,letterSpacing:"0.05em",
          transition:"all 0.3s",
          boxShadow:loading?"none":"0 8px 20px rgba(59,130,246,0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10
        }}>
          {loading?"⏳ ANALYZING...":"▶️ RUN LSTM MODEL"}
        </button>
      </div>

      <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.12)"}}>
        <div style={{color:"#64748b",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:20,fontWeight:800}}>Classification Result</div>
        {!result?(
          <div style={{color:"#94a3b8",textAlign:"center",padding:"80px 20px",fontSize:14}}>
            Submit features to test the model
          </div>
        ):result.error?(
          <div style={{color:"#f97316",background:"rgba(249,115,22,0.1)",border:"1.5px solid rgba(249,115,22,0.3)",borderRadius:12,padding:18,fontSize:13}}>{result.error}</div>
        ):(
          <div style={{borderRadius:16,padding:28,
            background:isRansom?"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))":"linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05))",
            border:`2px solid ${isRansom?"rgba(239,68,68,0.3)":"rgba(34,197,94,0.3)"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28}}>
              <div style={{fontSize:64,fontWeight:900,
                color:isRansom?"#ef4444":"#22c55e",lineHeight:1,textShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>{pct}%</div>
              <div>
                <div style={{fontWeight:900,fontSize:22,
                  color:isRansom?"#ef4444":"#22c55e"}}>
                  {isRansom?"RANSOMWARE DETECTED":"BENIGN ACTIVITY"}
                </div>
                <div style={{color:"#64748b",fontSize:13,marginTop:6}}>
                  💯 Confidence: {Math.round((result.confidence||0)*100)}%
                </div>
                <div style={{color:"#64748b",fontSize:13,marginTop:2}}>
                  📊 Threshold: {(result.threshold||0.7)*100}%
                </div>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#64748b",marginBottom:10}}>
                <span style={{fontWeight:700}}>Detection Probability</span>
                <span style={{color:isRansom?"#ef4444":"#22c55e",fontWeight:900}}>{pct}%</span>
              </div>
              <div style={{height:12,background:"rgba(255,255,255,0.5)",borderRadius:6,overflow:"hidden",border:"1px solid rgba(0,0,0,0.1)"}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:6,
                  background:isRansom?"linear-gradient(90deg,#ef4444,#dc2626)":"linear-gradient(90deg,#22c55e,#16a34a)",
                  transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow:`0 0 20px ${isRansom?"rgba(239,68,68,0.5)":"rgba(34,197,94,0.5)"}`}}/>
              </div>
            </div>
            <div style={{color:"#64748b",fontSize:11,marginTop:16,paddingTop:16,borderTop:"1px solid rgba(0,0,0,0.1)"}}>
              🧠 LSTM (100×6) • RanSAP 2022 Dataset • Cerber Family
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
      minHeight:"100vh",width:"100%",
      background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)",
      fontFamily:"'Segoe UI', 'Roboto', sans-serif",
      color:"#e2e8f0",
      margin:0,padding:0,
      overflowX:"hidden",
    }}>
      <style>{`
        * {box-sizing:border-box;margin:0;padding:0}
        body {margin:0;padding:0;overflow-x:hidden}
        @keyframes slideInUp {
          from {opacity:0;transform:translateY(30px)}
          to {opacity:1;transform:translateY(0)}
        }
        @keyframes pulse {0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes fadeIn {
          from {opacity:0}
          to {opacity:1}
        }
        ::-webkit-scrollbar {width:10px}
        ::-webkit-scrollbar-track {background:rgba(255,255,255,0.05)}
        ::-webkit-scrollbar-thumb {background:rgba(255,255,255,0.2);border-radius:5px}
        ::-webkit-scrollbar-thumb:hover {background:rgba(255,255,255,0.3)}
      `}</style>

      {/* HEADER */}
      <div style={{
        borderBottom:"1px solid rgba(255,255,255,0.1)",
        background:"linear-gradient(180deg,rgba(15,23,42,0.95),rgba(15,23,42,0.8))",
        backdropFilter:"blur(20px)",
        position:"sticky",top:0,zIndex:100,width:"100%",
      }}>
        <div style={{
          width:"100%",padding:"0 40px",maxWidth:"100%",
          display:"flex",alignItems:"center",height:80,gap:30,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{
              background:"linear-gradient(135deg,#3b82f6,#06b6d4)",
              padding:14,borderRadius:14,color:"#fff",display:"flex",
              boxShadow:"0 0 30px rgba(59,130,246,0.5)",
            }}><Icons.Shield/></div>
            <div>
              <div style={{fontWeight:900,fontSize:20,letterSpacing:"0.02em",color:"#f1f5f9"}}>RanSAP System</div>
              <div style={{fontSize:11,color:"#94a3b8",letterSpacing:"0.03em",marginTop:3}}>LSTM Ransomware Detection Engine</div>
            </div>
          </div>

          <div style={{flex:1}}/>

          <div style={{display:"flex",gap:8}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                background:tab===t.id?"rgba(59,130,246,0.2)":"transparent",
                color:tab===t.id?"#60a5fa":"#94a3b8",
                border:`2px solid ${tab===t.id?"rgba(59,130,246,0.5)":"transparent"}`,
                padding:"10px 20px",borderRadius:10,cursor:"pointer",
                fontSize:14,fontWeight:700,letterSpacing:"0.02em",
                display:"flex",alignItems:"center",gap:8,
                transition:"all 0.2s",
                backdropFilter:"blur(10px)"
              }}><t.icon/>{t.label}</button>
            ))}
          </div>

          <div style={{
            display:"flex",alignItems:"center",gap:10,
            background:backendOk===null?"rgba(251,191,36,0.15)":backendOk?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)",
            border:`1.5px solid ${backendOk===null?"rgba(251,191,36,0.4)":backendOk?"rgba(34,197,94,0.4)":"rgba(239,68,68,0.4)"}`,
            padding:"8px 16px",borderRadius:12,
            backdropFilter:"blur(10px)"
          }}>
            <div style={{
              width:10,height:10,borderRadius:"50%",
              background:backendOk===null?"#fbbf24":backendOk?"#22c55e":"#ef4444",
              boxShadow:`0 0 12px ${backendOk===null?"rgba(251,191,36,0.6)":backendOk?"rgba(34,197,94,0.6)":"rgba(239,68,68,0.6)"}`,
              animation:backendOk?"pulse 2s infinite":"none",
            }}/>
            <span style={{fontSize:12,color:backendOk===null?"#fbbf24":backendOk?"#22c55e":"#ef4444",letterSpacing:"0.03em",fontWeight:800}}>
              {backendOk===null?"CONNECTING":backendOk?"● LIVE":"● OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{width:"100%",minHeight:"calc(100vh - 80px)",padding:"40px"}}>

        {backendOk===false&&(
          <div style={{
            background:"linear-gradient(135deg,rgba(239,68,68,0.15),rgba(239,68,68,0.05))",
            border:"1.5px solid rgba(239,68,68,0.3)",
            borderRadius:16,padding:"18px 24px",marginBottom:32,
            color:"#fca5a5",fontSize:14,display:"flex",alignItems:"center",gap:14,
            backdropFilter:"blur(10px)"
          }}>
            ⚠️ Backend Offline — <code style={{background:"rgba(0,0,0,0.3)",padding:"4px 12px",borderRadius:8,color:"#f1f5f9",fontFamily:"monospace",fontSize:12,fontWeight:700}}>python backend/app.py</code>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:40}}>
            <div style={{animation:"fadeIn 0.5s ease"}}>
              <h1 style={{fontSize:40,fontWeight:900,color:"#f1f5f9",marginBottom:12,letterSpacing:"-1px"}}>System Dashboard</h1>
              <p style={{color:"#94a3b8",fontSize:16}}>
                Real-time ransomware detection & system monitoring
                {lastUpd&&<span style={{color:"#475569",marginLeft:16}}>• {lastUpd}</span>}
              </p>
            </div>

            {/* STAT CARDS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:20,width:"100%"}}>
              <StatCard icon={Icons.Alert}    label="Detections"  value={status?.ransomware_detections??0} color="red" pulse={status?.ransomware_detections>0}/>
              <StatCard icon={Icons.Activity} label="Predictions" value={status?.total_predictions??0}     color="blue"/>
              <StatCard icon={Icons.Kill}     label="Eliminated"  value={status?.processes_killed??0}      color="orange"/>
              <StatCard icon={Icons.Database} label="Alerts Log"  value={status?.alert_count??0}           color="purple"/>
            </div>

            {/* STATUS + ALERTS GRID */}
            <div style={{display:"grid",gridTemplateColumns:"320px 1fr",gap:28,width:"100%"}}>
              <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:20,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
                <div style={{color:"#334155",fontSize:12,letterSpacing:"0.1em",fontWeight:900,textTransform:"uppercase",marginBottom:22,borderBottom:"2px solid rgba(0,0,0,0.08)",paddingBottom:16}}>Engine Status</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {[
                    ["Status","LIVE"],
                    ["Version","2.0"],
                    ["Model","LSTM"],
                    ["Dataset","RanSAP 2022"],
                    ["Accuracy","94.2%"],
                    ["Window","100 events"],
                    ["Uptime",status?.uptime_secs?`${Math.floor(status.uptime_secs/3600)}h`:"—"],
                  ].map(([k,v])=>(
                    <div key={k} style={{
                      display:"flex",justifyContent:"space-between",alignItems:"center",
                      padding:"12px 0",borderBottom:"1px solid rgba(0,0,0,0.06)",fontSize:13,
                    }}>
                      <span style={{color:"#64748b",fontWeight:600}}>{k}</span>
                      <span style={{
                        color: k==="Status"?"#22c55e":"#1e293b",
                        fontSize:13,fontWeight:800,
                        background:k==="Status"?"rgba(34,197,94,0.2)":"transparent",
                        padding:k==="Status"?"4px 10px":"0",
                        borderRadius:6
                      }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:20,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
                <div style={{color:"#334155",fontSize:12,letterSpacing:"0.1em",fontWeight:900,textTransform:"uppercase",marginBottom:22,borderBottom:"2px solid rgba(0,0,0,0.08)",paddingBottom:16,display:"flex",justifyContent:"space-between"}}>
                  <span>Recent Alerts Log</span>
                  {alerts.length>0&&<span style={{color:"#ef4444",fontSize:11,fontWeight:900}}>{alerts.length} Events</span>}
                </div>
                {alerts.length===0?(
                  <div style={{textAlign:"center",padding:"70px 20px",color:"#22c55e"}}>
                    <div style={{fontSize:42,marginBottom:12}}>✓</div>
                    <div style={{fontSize:15,fontWeight:700}}>System Secure</div>
                    <div style={{fontSize:12,color:"#64748b",marginTop:6}}>No threats detected</div>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:400,overflowY:"auto"}}>
                    {alerts.slice(0,8).map((a,i)=><AlertRow key={i} alert={a} i={i}/>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {tab==="alerts"&&(
          <div style={{display:"flex",flexDirection:"column",gap:32,animation:"fadeIn 0.5s ease"}}>
            <div>
              <h1 style={{fontSize:40,fontWeight:900,color:"#f1f5f9",marginBottom:12}}>Alert Log</h1>
              <p style={{color:"#94a3b8",fontSize:16}}>Complete detection event history</p>
            </div>

            <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
              {alerts.length===0?(
                <div style={{textAlign:"center",padding:"100px 20px"}}>
                  <div style={{fontSize:50,marginBottom:16}}>✓</div>
                  <div style={{color:"#22c55e",fontSize:18,fontWeight:800}}>No Alerts</div>
                  <div style={{color:"#94a3b8",fontSize:14,marginTop:8}}>System is running normally</div>
                </div>
              ):(
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {alerts.map((a,i)=><AlertRow key={i} alert={a} i={i}/>)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PREDICT ── */}
        {tab==="predict"&&(
          <div style={{display:"flex",flexDirection:"column",gap:32,animation:"fadeIn 0.5s ease"}}>
            <div>
              <h1 style={{fontSize:40,fontWeight:900,color:"#f1f5f9",marginBottom:12}}>LSTM Prediction</h1>
              <p style={{color:"#94a3b8",fontSize:16}}>Test the trained neural network with custom disk I/O features</p>
            </div>
            <PredictPanel/>
          </div>
        )}

        {/* ── MONITOR ── */}
        {tab==="monitor"&&(
          <div style={{display:"flex",flexDirection:"column",gap:32,animation:"fadeIn 0.5s ease"}}>
            <div>
              <h1 style={{fontSize:40,fontWeight:900,color:"#f1f5f9",marginBottom:12}}>Live Monitor</h1>
              <p style={{color:"#94a3b8",fontSize:16}}>Real-time system metrics and statistics</p>
            </div>

            <div style={{background:"linear-gradient(135deg,rgba(255,255,255,0.9),rgba(255,255,255,0.7))",backdropFilter:"blur(20px)",border:"1.5px solid rgba(255,255,255,0.4)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.15)"}}>
              {status?(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:18}}>
                  {Object.entries(status)
                    .filter(([k])=>k!=="recent_alerts")
                    .slice(0,20)
                    .map(([k,v])=>(
                      <div key={k} style={{background:"linear-gradient(135deg,rgba(59,130,246,0.1),rgba(59,130,246,0.05))",borderRadius:14,
                        padding:"18px",border:"1.5px solid rgba(59,130,246,0.2)"}}>
                        <div style={{color:"#64748b",fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:800}}>
                          {k.replace(/_/g," ")}
                        </div>
                        <div style={{color:"#f1f5f9",fontSize:15,wordBreak:"break-all",fontWeight:900}}>
                          {String(v).substring(0,25)}
                        </div>
                      </div>
                    ))}
                </div>
              ):(
                <div style={{color:"#94a3b8",textAlign:"center",padding:80,fontSize:16}}>
                  Loading system metrics...
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
