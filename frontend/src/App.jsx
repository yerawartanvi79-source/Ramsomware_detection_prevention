import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = "http://127.0.0.1:5000";
const POLL_MS  = 3000;

const Icons = {
  Shield:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Alert:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Kill:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Database: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Zap:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Eye:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Crown:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:24,height:24}}><path d="M6 8l3-4 3 4m0 0l3-4 3 4M6 8l12 0M9 12v4c0 2-1 3-3 3m6-7v4c0 2 1 3 3 3"/></svg>,
};

function StatCard({ icon: I, label, value, color, pulse }) {
  const colorScheme = {
    red:    { bg: "rgba(220, 38, 38, 0.15)", border: "rgba(220, 38, 38, 0.4)", text: "#fca5a5", accent: "#fecaca" },
    blue:   { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)", text: "#93c5fd", accent: "#bfdbfe" },
    orange: { bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.4)", text: "#fed7aa", accent: "#ffedd5" },
    gold:   { bg: "rgba(212, 175, 55, 0.15)", border: "rgba(212, 175, 55, 0.4)", text: "#fcd34d", accent: "#fef3c7" },
  };
  
  const scheme = colorScheme[color] || colorScheme.gold;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${scheme.bg}, rgba(212, 175, 55, 0.05))`,
      border: `2px solid ${scheme.border}`,
      borderRadius: 16,
      padding: "32px",
      flex: 1,
      minWidth: "200px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
      transition: "all 0.3s ease",
      backdropFilter: "blur(10px)",
      position: "relative",
      overflow: "hidden",
      cursor: "pointer",
      transform: "translateZ(0)",
    }}
    onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${scheme.border}`}}
    onMouseLeave={(e) => {e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.2)"}}>
      <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:scheme.accent,borderRadius:"50%",filter:"blur(50px)",opacity:0.1}}/>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,position:"relative",zIndex:1}}>
        <div style={{
          color: scheme.accent,
          background: scheme.bg,
          padding: 12,
          borderRadius: 12,
          display: "flex",
          animation: pulse ? "pulse 2s infinite" : "none"
        }}><I/></div>
        <span style={{color:"#b4b0a3",fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase"}}>{label}</span>
      </div>
      <div style={{color: scheme.accent, fontSize:44,fontWeight:900,letterSpacing:"-2px",position:"relative",zIndex:1}}>{value ?? "—"}</div>
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
      background: isRansom ? "linear-gradient(90deg,rgba(220, 38, 38, 0.1),transparent)" : "linear-gradient(90deg,rgba(34, 197, 94, 0.1),transparent)",
      border: `1.5px solid ${isRansom ? "rgba(220, 38, 38, 0.4)" : "rgba(34, 197, 94, 0.4)"}`,
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      animation: `slideInUp ${0.3 + i*0.05}s ease`,
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {e.currentTarget.style.background = isRansom ? "linear-gradient(90deg,rgba(220, 38, 38, 0.15),transparent)" : "linear-gradient(90deg,rgba(34, 197, 94, 0.15),transparent)"; e.currentTarget.style.transform = "translateX(4px)"}}
    onMouseLeave={(e) => {e.currentTarget.style.background = isRansom ? "linear-gradient(90deg,rgba(220, 38, 38, 0.1),transparent)" : "linear-gradient(90deg,rgba(34, 197, 94, 0.1),transparent)"; e.currentTarget.style.transform = "translateX(0)"}}>
      <span style={{
        background: isRansom ? "linear-gradient(135deg, #dc2626, #991b1b)" : "linear-gradient(135deg, #22c55e, #16a34a)",
        color: "#ffffff",
        padding: "6px 12px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.08em",
        whiteSpace: "nowrap",
      }}>{isRansom ? "THREAT" : "SAFE"}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{color:"#f0d968",fontSize:14,fontWeight:700}}>
          {alert.process_name||alert.file||"Detection Event"}
          {alert.pid&&<span style={{color:"#b4b0a3",fontWeight:500,marginLeft:10}}>#{alert.pid}</span>}
        </div>
        {alert.action_taken&&<div style={{color:"#b4b0a3",fontSize:12,marginTop:4}}>
          <span style={{opacity:0.7}}>Action: </span><span style={{color:"#fca5a5",fontWeight:700}}>{alert.action_taken}</span>
        </div>}
      </div>
      {prob>0&&<div style={{color:isRansom?"#fca5a5":"#86efac",fontWeight:900,fontSize:16}}>{Math.round(prob*100)}%</div>}
      <div style={{color:"#706b60",fontSize:12,whiteSpace:"nowrap"}}>{ts}</div>
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
      <div style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.1),rgba(212, 175, 55, 0.05))",backdropFilter:"blur(20px)",border:"2px solid rgba(212, 175, 55, 0.3)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{color:"#d4af37",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:20,fontWeight:800}}>Input Features - RanSAP Dataset</div>
        <div style={{display:"flex",gap:12,marginBottom:20}}>
          <button onClick={()=>loadPreset("ransom")} style={{
            background:"linear-gradient(135deg,#dc2626,#991b1b)",border:"none",color:"#fecaca",
            padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,
            transition:"all 0.2s",boxShadow:"0 4px 12px rgba(220, 38, 38, 0.3)",flex:1
          }}>🔴 Ransomware</button>
          <button onClick={()=>loadPreset("benign")} style={{
            background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",color:"#dcfce7",
            padding:"10px 20px",borderRadius:10,cursor:"pointer",fontSize:13,fontWeight:700,
            transition:"all 0.2s",boxShadow:"0 4px 12px rgba(34, 197, 94, 0.3)",flex:1
          }}>🟢 Benign</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          {FIELDS.map(([key,label])=>(
            <div key={key}>
              <label style={{color:"#d4af37",fontSize:12,display:"block",marginBottom:8,fontWeight:700}}>{label}</label>
              <input type="number" value={vals[key]}
                onChange={e=>setVals(v=>({...v,[key]:parseFloat(e.target.value)||0}))}
                style={{width:"100%",background:"rgba(212, 175, 55, 0.08)",border:"1.5px solid rgba(212, 175, 55, 0.3)",
                  borderRadius:10,padding:"10px 14px",color:"#f0d968",fontSize:13,
                  outline:"none",boxSizing:"border-box",transition:"all 0.2s",fontWeight:600}}
                onFocus={e => {e.target.style.borderColor = "rgba(212, 175, 55, 0.8)"; e.target.style.background = "rgba(212, 175, 55, 0.15)"}}
                onBlur={e => {e.target.style.borderColor = "rgba(212, 175, 55, 0.3)"; e.target.style.background = "rgba(212, 175, 55, 0.08)"}}
              />
            </div>
          ))}
        </div>
        <button onClick={handlePredict} disabled={loading} style={{
          width:"100%",
          background:loading?"#706b60":"linear-gradient(135deg,#d4af37,#f0d968)",
          color:loading?"#b4b0a3":"#0a1428",border:"none",borderRadius:12,padding:"14px",
          cursor:loading?"not-allowed":"pointer",
          fontWeight:800,fontSize:15,letterSpacing:"0.05em",
          transition:"all 0.3s",
          boxShadow:loading?"none":"0 8px 20px rgba(212, 175, 55, 0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10
        }}>
          {loading?"⏳ ANALYZING...":"▶️ RUN LSTM MODEL"}
        </button>
      </div>

      <div style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.1),rgba(212, 175, 55, 0.05))",backdropFilter:"blur(20px)",border:"2px solid rgba(212, 175, 55, 0.3)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
        <div style={{color:"#d4af37",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:20,fontWeight:800}}>Classification Result</div>
        {!result?(
          <div style={{color:"#b4b0a3",textAlign:"center",padding:"80px 20px",fontSize:14}}>
            Submit features to test the model
          </div>
        ):result.error?(
          <div style={{color:"#fca5a5",background:"rgba(220, 38, 38, 0.1)",border:"1.5px solid rgba(220, 38, 38, 0.3)",borderRadius:12,padding:18,fontSize:13}}>{result.error}</div>
        ):(
          <div style={{borderRadius:16,padding:28,
            background:isRansom?"linear-gradient(135deg,rgba(220, 38, 38, 0.15),rgba(220, 38, 38, 0.05))":"linear-gradient(135deg,rgba(34, 197, 94, 0.15),rgba(34, 197, 94, 0.05))",
            border:`2px solid ${isRansom?"rgba(220, 38, 38, 0.3)":"rgba(34, 197, 94, 0.3)"}`}}>
            <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28}}>
              <div style={{fontSize:64,fontWeight:900,
                color:isRansom?"#fca5a5":"#86efac",lineHeight:1,textShadow:"0 2px 8px rgba(0,0,0,0.1)"}}>{pct}%</div>
              <div>
                <div style={{fontWeight:900,fontSize:22,
                  color:isRansom?"#fca5a5":"#86efac"}}>
                  {isRansom?"RANSOMWARE DETECTED":"BENIGN ACTIVITY"}
                </div>
                <div style={{color:"#b4b0a3",fontSize:13,marginTop:6}}>
                  💯 Confidence: {Math.round((result.confidence||0)*100)}%
                </div>
                <div style={{color:"#b4b0a3",fontSize:13,marginTop:2}}>
                  📊 Threshold: {(result.threshold||0.7)*100}%
                </div>
              </div>
            </div>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#b4b0a3",marginBottom:10}}>
                <span style={{fontWeight:700}}>Detection Probability</span>
                <span style={{color:isRansom?"#fca5a5":"#86efac",fontWeight:900}}>{pct}%</span>
              </div>
              <div style={{height:12,background:"rgba(212, 175, 55, 0.15)",borderRadius:6,overflow:"hidden",border:"1px solid rgba(212, 175, 55, 0.3)"}}>
                <div style={{width:`${pct}%`,height:"100%",borderRadius:6,
                  background:isRansom?"linear-gradient(90deg,#dc2626,#991b1b)":"linear-gradient(90deg,#22c55e,#16a34a)",
                  transition:"width 0.8s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow:`0 0 20px ${isRansom?"rgba(220, 38, 38, 0.5)":"rgba(34, 197, 94, 0.5)"}`}}/>
              </div>
            </div>
            <div style={{color:"#b4b0a3",fontSize:11,marginTop:16,paddingTop:16,borderTop:"1px solid rgba(212, 175, 55, 0.2)"}}>
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
      background:"linear-gradient(135deg, #0a1428 0%, #0f2847 50%, #0a1428 100%)",
      backgroundAttachment: "fixed",
      fontFamily:"'Montserrat', 'Segoe UI', 'Roboto', sans-serif",
      color:"#e8e5df",
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
        @keyframes pulse {0%,100%{opacity:1}50%{opacity:0.6}}
        @keyframes fadeIn {
          from {opacity:0}
          to {opacity:1}
        }
        ::-webkit-scrollbar {width:12px}
        ::-webkit-scrollbar-track {background:rgba(212, 175, 55, 0.05)}
        ::-webkit-scrollbar-thumb {background:linear-gradient(180deg, #d4af37, #f0d968);border-radius:6px}
        ::-webkit-scrollbar-thumb:hover {background:linear-gradient(180deg, #f0d968, #fef3c7)}
      `}</style>

      {/* HEADER */}
      <div style={{
        borderBottom:"2px solid rgba(212, 175, 55, 0.2)",
        background:"linear-gradient(180deg,rgba(10, 20, 40, 0.98),rgba(10, 20, 40, 0.9))",
        backdropFilter:"blur(20px)",
        position:"sticky",top:0,zIndex:100,width:"100%",
      }}>
        <div style={{
          width:"100%",padding:"0 40px",maxWidth:"100%",
          display:"flex",alignItems:"center",height:85,gap:30,
        }}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{
              background:"linear-gradient(135deg, #d4af37, #f0d968)",
              padding:16,borderRadius:14,color:"#0a1428",display:"flex",
              boxShadow:"0 0 30px rgba(212, 175, 55, 0.5)",
              fontWeight: 900,
            }}><Icons.Crown/></div>
            <div>
              <div style={{fontFamily:"'Playfair Display', serif",fontWeight:700,fontSize:22,letterSpacing:"0.03em",color:"#f0d968"}}>RanSAP System</div>
              <div style={{fontSize:11,color:"#b4b0a3",letterSpacing:"0.04em",marginTop:3,fontWeight:500}}>LSTM Ransomware Detection Engine</div>
            </div>
          </div>

          <div style={{flex:1}}/>

          <div style={{display:"flex",gap:8}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                background:tab===t.id?"linear-gradient(135deg, #d4af37, #f0d968)":"rgba(212, 175, 55, 0.1)",
                color:tab===t.id?"#0a1428":"#d4af37",
                border:`2px solid ${tab===t.id?"#d4af37":"rgba(212, 175, 55, 0.3)"}`,
                padding:"10px 20px",borderRadius:10,cursor:"pointer",
                fontSize:14,fontWeight:700,letterSpacing:"0.03em",
                display:"flex",alignItems:"center",gap:8,
                transition:"all 0.2s",
                backdropFilter:"blur(10px)"
              }}><t.icon/>{t.label}</button>
            ))}
          </div>

          <div style={{
            display:"flex",alignItems:"center",gap:10,
            background:backendOk===null?"rgba(251, 191, 36, 0.15)":backendOk?"rgba(34, 197, 94, 0.15)":"rgba(220, 38, 38, 0.15)",
            border:`1.5px solid ${backendOk===null?"rgba(251, 191, 36, 0.4)":backendOk?"rgba(34, 197, 94, 0.4)":"rgba(220, 38, 38, 0.4)"}`,
            padding:"8px 16px",borderRadius:12,
            backdropFilter:"blur(10px)"
          }}>
            <div style={{
              width:10,height:10,borderRadius:"50%",
              background:backendOk===null?"#fbbf24":backendOk?"#22c55e":"#dc2626",
              boxShadow:`0 0 12px ${backendOk===null?"rgba(251, 191, 36, 0.6)":backendOk?"rgba(34, 197, 94, 0.6)":"rgba(220, 38, 38, 0.6)"}`,
              animation:backendOk?"pulse 2s infinite":"none",
            }}/>
            <span style={{fontSize:12,color:backendOk===null?"#fbbf24":backendOk?"#22c55e":"#dc2626",letterSpacing:"0.03em",fontWeight:800}}>
              {backendOk===null?"CONNECTING":backendOk?"● LIVE":"● OFFLINE"}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{width:"100%",minHeight:"calc(100vh - 85px)",padding:"40px"}}>

        {backendOk===false&&(
          <div style={{
            background:"linear-gradient(135deg,rgba(220, 38, 38, 0.15),rgba(220, 38, 38, 0.05))",
            border:"1.5px solid rgba(220, 38, 38, 0.3)",
            borderRadius:16,padding:"18px 24px",marginBottom:32,
            color:"#fca5a5",fontSize:14,display:"flex",alignItems:"center",gap:14,
            backdropFilter:"blur(10px)"
          }}>
            ⚠️ Backend Offline — <code style={{background:"rgba(0,0,0,0.3)",padding:"4px 12px",borderRadius:8,color:"#f0d968",fontFamily:"monospace",fontSize:12,fontWeight:700}}>python backend/app.py</code>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div style={{display:"flex",flexDirection:"column",gap:40}}>
            <div style={{animation:"fadeIn 0.5s ease"}}>
              <h1 style={{fontSize:44,fontWeight:900,color:"#f0d968",marginBottom:12,letterSpacing:"-1px"}}>System Dashboard</h1>
              <p style={{color:"#b4b0a3",fontSize:15,fontWeight:500}}>
                Real-time ransomware detection & system monitoring
                {lastUpd&&<span style={{color:"#706b60",marginLeft:16}}>• {lastUpd}</span>}
              </p>
            </div>

            {/* STAT CARDS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",gap:20,width:"100%"}}>
              <StatCard icon={Icons.Alert}    label="Detections"  value={status?.ransomware_detections??0} color="red" pulse={status?.ransomware_detections>0}/>
              <StatCard icon={Icons.Activity} label="Predictions" value={status?.total_predictions??0}     color="blue"/>
              <StatCard icon={Icons.Kill}     label="Eliminated"  value={status?.processes_killed??0}      color="orange"/>
              <StatCard icon={Icons.Database} label="Alerts Log"  value={status?.alert_count??0}           color="gold"/>
            </div>

            {/* STATUS + ALERTS GRID */}
            <div style={{display:"grid",gridTemplateColumns:"340px 1fr",gap:28,width:"100%"}}>
              <div style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.1),rgba(212, 175, 55, 0.05))",backdropFilter:"blur(20px)",border:"2px solid rgba(212, 175, 55, 0.3)",borderRadius:20,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                <div style={{color:"#d4af37",fontSize:12,letterSpacing:"0.1em",fontWeight:900,textTransform:"uppercase",marginBottom:22,borderBottom:"2px solid rgba(212, 175, 55, 0.2)",paddingBottom:16}}>Engine Status</div>
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
                      padding:"12px 0",borderBottom:"1px solid rgba(212, 175, 55, 0.1)",fontSize:13,
                    }}>
                      <span style={{color:"#b4b0a3",fontWeight:600}}>{k}</span>
                      <span style={{
                        color: k==="Status"?"#86efac":"#f0d968",
                        fontSize:13,fontWeight:800,
                        background:k==="Status"?"rgba(34, 197, 94, 0.2)":"transparent",
                        padding:k==="Status"?"4px 10px":"0",
                        borderRadius:6
                      }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.1),rgba(212, 175, 55, 0.05))",backdropFilter:"blur(20px)",border:"2px solid rgba(212, 175, 55, 0.3)",borderRadius:20,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
                <div style={{color:"#d4af37",fontSize:12,letterSpacing:"0.1em",fontWeight:900,textTransform:"uppercase",marginBottom:22,borderBottom:"2px solid rgba(212, 175, 55, 0.2)",paddingBottom:16,display:"flex",justifyContent:"space-between"}}>
                  <span>Recent Alerts Log</span>
                  {alerts.length>0&&<span style={{color:"#fca5a5",fontSize:11,fontWeight:900}}>{alerts.length} Events</span>}
                </div>
                {alerts.length===0?(
                  <div style={{textAlign:"center",padding:"70px 20px",color:"#86efac"}}>
                    <div style={{fontSize:42,marginBottom:12}}>✓</div>
                    <div style={{fontSize:15,fontWeight:700}}>System Secure</div>
                    <div style={{fontSize:12,color:"#b4b0a3",marginTop:6}}>No threats detected</div>
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
              <h1 style={{fontSize:44,fontWeight:900,color:"#f0d968",marginBottom:12}}>Alert Log</h1>
              <p style={{color:"#b4b0a3",fontSize:15,fontWeight:500}}>Complete detection event history</p>
            </div>

            <div style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.1),rgba(212, 175, 55, 0.05))",backdropFilter:"blur(20px)",border:"2px solid rgba(212, 175, 55, 0.3)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
              {alerts.length===0?(
                <div style={{textAlign:"center",padding:"100px 20px"}}>
                  <div style={{fontSize:50,marginBottom:16}}>✓</div>
                  <div style={{color:"#86efac",fontSize:18,fontWeight:800}}>No Alerts</div>
                  <div style={{color:"#b4b0a3",fontSize:14,marginTop:8}}>System is running normally</div>
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
              <h1 style={{fontSize:44,fontWeight:900,color:"#f0d968",marginBottom:12}}>LSTM Prediction</h1>
              <p style={{color:"#b4b0a3",fontSize:15,fontWeight:500}}>Test the trained neural network with custom disk I/O features</p>
            </div>
            <PredictPanel/>
          </div>
        )}

        {/* ── MONITOR ── */}
        {tab==="monitor"&&(
          <div style={{display:"flex",flexDirection:"column",gap:32,animation:"fadeIn 0.5s ease"}}>
            <div>
              <h1 style={{fontSize:44,fontWeight:900,color:"#f0d968",marginBottom:12}}>Live Monitor</h1>
              <p style={{color:"#b4b0a3",fontSize:15,fontWeight:500}}>Real-time system metrics and statistics</p>
            </div>

            <div style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.1),rgba(212, 175, 55, 0.05))",backdropFilter:"blur(20px)",border:"2px solid rgba(212, 175, 55, 0.3)",borderRadius:20,padding:32,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
              {status?(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:18}}>
                  {Object.entries(status)
                    .filter(([k])=>k!=="recent_alerts")
                    .slice(0,20)
                    .map(([k,v])=>(
                      <div key={k} style={{background:"linear-gradient(135deg,rgba(212, 175, 55, 0.15),rgba(212, 175, 55, 0.05))",borderRadius:14,
                        padding:"18px",border:"1.5px solid rgba(212, 175, 55, 0.3)",transition:"all 0.2s"}}
                        onMouseEnter={(e) => {e.currentTarget.style.background = "linear-gradient(135deg,rgba(212, 175, 55, 0.25),rgba(212, 175, 55, 0.1))"; e.currentTarget.style.transform = "translateY(-2px)"}}
                        onMouseLeave={(e) => {e.currentTarget.style.background = "linear-gradient(135deg,rgba(212, 175, 55, 0.15),rgba(212, 175, 55, 0.05))"; e.currentTarget.style.transform = "translateY(0)"}}>
                        <div style={{color:"#b4b0a3",fontSize:11,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em",fontWeight:800}}>
                          {k.replace(/_/g," ")}
                        </div>
                        <div style={{color:"#f0d968",fontSize:15,wordBreak:"break-all",fontWeight:900}}>
                          {String(v).substring(0,25)}
                        </div>
                      </div>
                    ))}
                </div>
              ):(
                <div style={{color:"#b4b0a3",textAlign:"center",padding:80,fontSize:16}}>
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
