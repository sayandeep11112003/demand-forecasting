import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Zap, TrendingUp, Activity, Boxes, SlidersHorizontal, ShieldCheck,
  ArrowRight, ChevronDown,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const HeroScene3D = lazy(() => import("./scenes/HeroScene3D.jsx"));

/* ============================================================================
   Dark "Grid Current" palette — matches the authenticated app (App.jsx
   defines its own copy; Landing renders pre-login so it can't import it). */
const L = {
  void: "#070B12", panel: "#0F141C", panel2: "#151B23", border: "#232B37",
  text: "#E8ECF2", muted: "#8A95A6", faint: "#5B6675",
  copper: "#CD8B4F", cyan: "#5AB2C9", green: "#5FB489", amber: "#E0A458",
};
const FD = "'Space Grotesk',system-ui,sans-serif";
const FB = "'Inter',system-ui,sans-serif";
const FM = "'JetBrains Mono',ui-monospace,monospace";

const FEATURES = [
  { Icon: TrendingUp, title: "AI Demand Forecasting", body: "Trend/seasonality models project 6-month demand per material category, with confidence bands built from real forecast error." },
  { Icon: Activity, title: "Delay Risk Prediction", body: "A random-forest model scores every shipment against distance, transport mode and supplier history before it's late." },
  { Icon: ShieldCheck, title: "Real-Time Anomaly Monitor", body: "A genuine isolation-forest ensemble rescoring every few seconds, flagging outlier POs and shipments as they happen." },
  { Icon: Boxes, title: "Interactive 3D Network", body: "Drag-to-orbit visualization of every supplier-project relationship, built from live purchase-order data, not a mockup." },
  { Icon: SlidersHorizontal, title: "What-If Simulator", body: "Adjust category, region, transport mode and urgency and watch the interpretable delay estimate update instantly." },
  { Icon: Zap, title: "Role-Based Governance", body: "Six roles gate what's editable across all twelve data categories, from procurement to sustainability reporting." },
];

const STEPS = [
  { n: "01", title: "Every event gets tracked", body: "Purchase orders, shipments, inspections, disruptions and inventory positions all live in one place." },
  { n: "02", title: "Models score it continuously", body: "Delay prediction, demand forecasting and anomaly detection run against the live dataset, not a nightly batch." },
  { n: "03", title: "You see it before it's a problem", body: "Flagged anomalies convert straight into tracked disruption records with one click." },
];

function useCountUp(ref, target, { decimals = 0, suffix = "", duration = 1.4 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { v: 0 };
    const st = ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(obj, {
        v: target, duration, ease: "power2.out",
        onUpdate: () => { el.textContent = obj.v.toFixed(decimals) + suffix; },
      }),
    });
    return () => st.kill();
  }, [ref, target, decimals, suffix, duration]);
}

function Stat({ value, decimals, suffix, label }) {
  const ref = useRef(null);
  useCountUp(ref, value, { decimals, suffix });
  return (
    <div style={{ textAlign: "center" }}>
      <div ref={ref} style={{ fontFamily: FD, fontSize: 40, fontWeight: 700, color: L.text }}>0</div>
      <div style={{ fontFamily: FM, fontSize: 11, color: L.muted, letterSpacing: ".06em", textTransform: "uppercase", marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Nav({ onEnter }) {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: solid ? "rgba(7,11,18,.85)" : "transparent",
      backdropFilter: solid ? "blur(10px)" : "none",
      borderBottom: solid ? `1px solid ${L.border}` : "1px solid transparent",
      transition: "background .25s, border-color .25s",
      display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Zap size={19} color={L.copper} />
        <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 15, color: L.text }}>Demand Forecasting</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        {[["features", "Features"], ["how", "How it works"], ["stats", "Model"]].map(([id, label]) => (
          <button key={id} onClick={() => scrollTo(id)} style={{
            background: "none", border: "none", color: L.muted, fontFamily: FB, fontSize: 13,
            cursor: "pointer", display: window.innerWidth < 720 ? "none" : "block",
          }}>{label}</button>
        ))}
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onEnter} style={{
          background: L.copper, border: "none", color: L.void, fontFamily: FB, fontWeight: 600,
          fontSize: 13, padding: "9px 18px", borderRadius: 7, cursor: "pointer",
        }}>Sign In</motion.button>
      </div>
    </div>
  );
}

function Hero({ onEnter }) {
  const heroRef = useRef(null);
  const sceneWrapRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(sceneWrapRef.current, {
        yPercent: 22, ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={heroRef} style={{
      position: "relative", height: "100vh", scrollSnapAlign: "start",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <div ref={sceneWrapRef} style={{ position: "absolute", inset: "-10% 0", zIndex: 0 }}>
        <Suspense fallback={<div style={{ position: "absolute", inset: 0, background: L.void }} />}>
          <HeroScene3D />
        </Suspense>
      </div>
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 60%, rgba(7,11,18,.25) 0%, rgba(7,11,18,.7) 65%, rgba(7,11,18,.92) 100%)",
      }} />
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", maxWidth: 780, padding: "0 24px" }}>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          style={{ fontFamily: FM, fontSize: 11.5, letterSpacing: ".14em", color: L.cyan, textTransform: "uppercase", marginBottom: 18 }}>
          AI-Powered Supply Chain Intelligence
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          style={{ fontFamily: FD, fontSize: "clamp(34px,5.2vw,58px)", fontWeight: 700, color: L.text, margin: "0 0 18px", lineHeight: 1.08 }}>
          The future of transmission<br />demand forecasting
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.22 }}
          style={{ fontFamily: FB, fontSize: 16, color: L.muted, lineHeight: 1.6, margin: "0 0 32px" }}>
          Real machine-learning models, real-time anomaly monitoring and a live 3D view of your entire
          supplier network — running on your actual purchase order and shipment data.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.34 }}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={onEnter} style={{
            background: L.copper, border: "none", color: L.void, fontFamily: FB, fontWeight: 600, fontSize: 14.5,
            padding: "13px 26px", borderRadius: 9, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}>Enter Platform <ArrowRight size={16} /></motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "transparent", border: `1px solid ${L.border}`, color: L.text, fontFamily: FB,
              fontWeight: 600, fontSize: 14.5, padding: "13px 26px", borderRadius: 9, cursor: "pointer",
            }}>See how it works</motion.button>
        </motion.div>
      </div>
      <motion.div
        animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }}
        style={{ position: "absolute", bottom: 26, left: "50%", transform: "translateX(-50%)", zIndex: 2, color: L.faint }}>
        <ChevronDown size={20} />
      </motion.div>
    </section>
  );
}

function CapabilityStrip() {
  const items = ["Random Forest", "Isolation Forest", "Three.js / WebGL", "Real-Time Monitoring", "Resend Email", "Role-Based Access"];
  return (
    <section style={{
      padding: "26px 24px", borderTop: `1px solid ${L.border}`, borderBottom: `1px solid ${L.border}`,
      background: L.panel, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "14px 34px",
    }}>
      {items.map((t) => (
        <span key={t} style={{ fontFamily: FM, fontSize: 11, color: L.faint, letterSpacing: ".04em" }}>{t}</span>
      ))}
    </section>
  );
}

function Features() {
  return (
    <section id="features" style={{ minHeight: "100vh", scrollSnapAlign: "start", padding: "110px 24px 80px", background: L.void }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6 }} style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontFamily: FM, fontSize: 11.5, letterSpacing: ".14em", color: L.copper, textTransform: "uppercase", marginBottom: 12 }}>
            Forecasting that's actually explainable
          </div>
          <h2 style={{ fontFamily: FD, fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, color: L.text, margin: 0 }}>
            Six systems, one live dataset
          </h2>
        </motion.div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
          {FEATURES.map(({ Icon, title, body }, i) => (
            <motion.div key={title}
              initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              whileHover={{ y: -4, borderColor: L.copper }}
              style={{
                background: L.panel, border: `1px solid ${L.border}`, borderRadius: 12, padding: 24,
              }}>
              <Icon size={22} color={L.copper} style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 700, color: L.text, marginBottom: 8 }}>{title}</div>
              <div style={{ fontFamily: FB, fontSize: 13, color: L.muted, lineHeight: 1.6 }}>{body}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const sectionRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el, { y: 60 * (i % 2 === 0 ? 1 : -1) }, {
          y: 0, ease: "none",
          scrollTrigger: { trigger: el, start: "top 95%", end: "top 40%", scrub: true },
        });
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="how" ref={sectionRef} style={{ minHeight: "100vh", scrollSnapAlign: "start", padding: "110px 24px 80px", background: L.panel }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: FM, fontSize: 11.5, letterSpacing: ".14em", color: L.cyan, textTransform: "uppercase", marginBottom: 12 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: FD, fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, color: L.text, margin: 0 }}>
            From raw events to action
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 30 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} ref={(el) => (cardRefs.current[i] = el)}>
              <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, color: L.border, marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontFamily: FD, fontSize: 17, fontWeight: 700, color: L.text, marginBottom: 10 }}>{s.title}</div>
              <div style={{ fontFamily: FB, fontSize: 13.5, color: L.muted, lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection({ model }) {
  return (
    <section id="stats" style={{
      minHeight: "100vh", scrollSnapAlign: "start", padding: "110px 24px 80px",
      background: L.void, display: "flex", alignItems: "center",
    }}>
      <div style={{ maxWidth: 940, margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 50 }}>
          <div style={{ fontFamily: FM, fontSize: 11.5, letterSpacing: ".14em", color: L.copper, textTransform: "uppercase", marginBottom: 12 }}>
            Trained on real order history
          </div>
          <h2 style={{ fontFamily: FD, fontSize: "clamp(26px,3.4vw,38px)", fontWeight: 700, color: L.text, margin: 0 }}>
            Numbers straight from the model bundle
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 30, marginBottom: 56 }}>
          <Stat value={model.meta.n_orders} label="Orders analyzed" />
          <Stat value={model.meta.n_suppliers} label="Suppliers tracked" />
          <Stat value={model.delay_model.r2 * 100} decimals={1} suffix="%" label="Delay model R²" />
          <Stat value={model.delay_model.mae_days} decimals={1} suffix="d" label="Avg. delay error" />
        </div>
        <div style={{ background: L.panel, border: `1px solid ${L.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontFamily: FM, fontSize: 11, color: L.muted, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 14 }}>
            What predicts a delay
          </div>
          {model.delay_model.feature_importance.slice(0, 5).map((f) => (
            <div key={f.feature} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 168, fontFamily: FB, fontSize: 12.5, color: L.text, flexShrink: 0 }}>{f.feature}</div>
              <div style={{ flex: 1, height: 6, background: L.border, borderRadius: 3, overflow: "hidden" }}>
                <motion.div initial={{ width: 0 }} whileInView={{ width: `${f.importance}%` }} viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: "easeOut" }} style={{ height: "100%", background: L.copper }} />
              </div>
              <div style={{ fontFamily: FM, fontSize: 11.5, color: L.faint, width: 40, textAlign: "right" }}>{f.importance}%</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ onEnter }) {
  return (
    <section style={{
      minHeight: "100vh", scrollSnapAlign: "start", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", textAlign: "center", padding: "24px",
      background: `radial-gradient(ellipse at 50% 40%, ${L.panel} 0%, ${L.void} 70%)`,
    }}>
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
        <div style={{ fontFamily: FM, fontSize: 11.5, letterSpacing: ".14em", color: L.cyan, textTransform: "uppercase", marginBottom: 16 }}>
          Ready when you are
        </div>
        <h2 style={{ fontFamily: FD, fontSize: "clamp(28px,4.2vw,46px)", fontWeight: 700, color: L.text, margin: "0 0 18px", maxWidth: 640 }}>
          See your supply chain in a whole new dimension
        </h2>
        <p style={{ fontFamily: FB, fontSize: 15, color: L.muted, maxWidth: 520, margin: "0 auto 34px", lineHeight: 1.6 }}>
          Sign in with a seeded demo account or register — an administrator approves new accounts before access is granted.
        </p>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={onEnter} style={{
          background: L.copper, border: "none", color: L.void, fontFamily: FB, fontWeight: 700, fontSize: 15.5,
          padding: "15px 34px", borderRadius: 10, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9,
        }}>Enter Platform <ArrowRight size={17} /></motion.button>
      </motion.div>
      <div style={{ marginTop: 70, fontFamily: FM, fontSize: 11, color: L.faint }}>
        Demand Forecasting — built on Random Forest, Isolation Forest and Three.js
      </div>
    </section>
  );
}

export default function Landing({ onEnter, model }) {
  useEffect(() => {
    document.documentElement.style.scrollSnapType = "y proximity";
    return () => { document.documentElement.style.scrollSnapType = ""; };
  }, []);

  return (
    <div style={{ background: L.void, fontFamily: FB }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>
      <Nav onEnter={onEnter} />
      <Hero onEnter={onEnter} />
      <CapabilityStrip />
      <Features />
      <HowItWorks />
      <StatsSection model={model} />
      <FinalCTA onEnter={onEnter} />
    </div>
  );
}
