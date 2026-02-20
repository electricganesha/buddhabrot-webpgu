import { useState } from "react";
import { iterToSlider, sliderToIter } from "../utils/iterSlider";

/** Iteration channel identifier. */
type IterChannel = "r" | "g" | "b" | "max";

/** Rotation plane identifier. */
type RotPlane = "xz" | "yw";

/** Props accepted by the {@link ControlPanel} component. */
export interface ControlPanelProps {
  // Iteration values
  readonly redIter: number;
  readonly greenIter: number;
  readonly blueIter: number;
  readonly maxIterations: number;

  // Toggle states
  readonly nebulaEnabled: boolean;
  readonly nebulaAestheticEnabled: boolean;
  readonly colorCoreEnabled: boolean;
  readonly coreColorHex: string;
  readonly rotationEnabled: boolean;
  readonly autoRotate: boolean;
  readonly orbitEnabled: boolean;
  readonly ghostModeEnabled: boolean;
  readonly heartbeatEnabled: boolean;
  readonly heartbeatSpeed: number;
  readonly heartbeatIntensity: number;
  readonly heartbeatWaveform: "sin" | "cos" | "tan" | "sqr";

  // Rotation angles (radians)
  readonly rotXZ: number;
  readonly rotYW: number;

  // Callbacks
  readonly onUpdateIter: (channel: IterChannel, value: number) => void;
  readonly onUpdateRot: (plane: RotPlane, value: number) => void;
  readonly onNebulaChange: (enabled: boolean) => void;
  readonly onAestheticChange: (enabled: boolean) => void;
  readonly onColorCoreChange: (enabled: boolean) => void;
  readonly onCoreColorChange: (hex: string) => void;
  readonly onRotationChange: (enabled: boolean) => void;
  readonly onAutoRotateChange: (enabled: boolean) => void;
  readonly onOrbitChange: (enabled: boolean) => void;
  readonly onGhostModeChange: (enabled: boolean) => void;
  readonly onHeartbeatChange: (enabled: boolean) => void;
  readonly onHeartbeatSpeedChange: (speed: number) => void;
  readonly onHeartbeatIntensityChange: (intensity: number) => void;
  readonly onHeartbeatWaveformChange: (
    waveform: "sin" | "cos" | "tan" | "sqr",
  ) => void;
}

/** Props for {@link SliderRow}. */
interface SliderRowProps {
  readonly channel: IterChannel;
  readonly label: string;
  readonly value: number;
  readonly color: string;
  readonly dotColor: string;
  readonly onUpdateIter: (channel: IterChannel, value: number) => void;
}

/** A single iteration slider row with coloured dot, label, and value. */
function SliderRow({
  channel,
  label,
  value,
  color,
  onUpdateIter,
}: SliderRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 24,
      }}
    >
      <span
        style={{
          opacity: 0.5,
          fontSize: 11,
          width: 36,
          textAlign: "right",
        }}
      >
        {label}
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={iterToSlider(value)}
        onChange={(e) => {
          onUpdateIter(channel, sliderToIter(Number(e.target.value)));
        }}
        style={{
          width: 160,
          accentColor: color,
          height: 4,
        }}
      />
      <span
        style={{
          minWidth: 44,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          opacity: 0.8,
          fontSize: 12,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Props for {@link Toggle}. */
interface ToggleProps {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly accentColor?: string;
}

/** A labelled checkbox toggle. */
function Toggle({
  id,
  label,
  checked,
  onChange,
  accentColor = "#888",
}: ToggleProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor, margin: 0 }}
      />
      <label
        htmlFor={id}
        style={{ fontSize: 11, opacity: 0.5, cursor: "pointer" }}
      >
        {label}
      </label>
    </div>
  );
}

/** Props for {@link RotationSlider}. */
interface RotationSliderProps {
  readonly plane: RotPlane;
  readonly value: number;
  readonly disabled: boolean;
  readonly onUpdateRot: (plane: RotPlane, value: number) => void;
}

/** A rotation-plane slider (degrees, mapped to/from radians). */
function RotationSlider({
  plane,
  value,
  disabled,
  onUpdateRot,
}: RotationSliderProps) {
  const deg = Math.round((value * 180) / Math.PI);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        height: 24,
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <span
        style={{ opacity: 0.5, fontSize: 11, width: 36, textAlign: "right" }}
      >
        {plane.toUpperCase()}
      </span>
      <input
        type="range"
        min={-180}
        max={180}
        step={1}
        value={deg}
        onChange={(e) =>
          onUpdateRot(plane, (Number(e.target.value) * Math.PI) / 180)
        }
        disabled={disabled}
        style={{ width: 160, accentColor: "#c084fc", height: 4 }}
      />
      <span
        style={{
          minWidth: 44,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          opacity: 0.8,
          fontSize: 12,
        }}
      >
        {deg}°
      </span>
    </div>
  );
}

/** Props for {@link ControlSection}. */
interface ControlSectionProps {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly children: React.ReactNode;
}

/** Collapsible HTML section for grouping controls smoothly. */
function ControlSection({
  title,
  defaultOpen = false,
  children,
}: ControlSectionProps) {
  return (
    <details
      open={defaultOpen}
      style={{
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        paddingTop: 8,
        marginTop: 8,
        paddingBottom: 4,
      }}
    >
      <summary
        style={{
          fontSize: 10,
          opacity: 0.6,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          cursor: "pointer",
          userSelect: "none",
          listStyle: "none", // hides default widget in some browsers
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            display: "inline-block",
            transition: "transform 0.2s",
            transformOrigin: "center",
          }}
          className="details-arrow"
        >
          ▶
        </span>
        {title}
        <style>{`
          details[open] summary .details-arrow {
            transform: rotate(90deg);
          }
          details summary::-webkit-details-marker {
            display: none;
          }
        `}</style>
      </summary>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          paddingLeft: 4,
        }}
      >
        {children}
      </div>
    </details>
  );
}

/** Floating control panel for iteration counts, nebula mode, and rotation. */
export default function ControlPanel({
  redIter,
  greenIter,
  blueIter,
  maxIterations,
  nebulaEnabled,
  nebulaAestheticEnabled,
  colorCoreEnabled,
  coreColorHex,
  rotationEnabled,
  autoRotate,
  orbitEnabled,
  rotXZ,
  rotYW,
  onUpdateIter,
  onUpdateRot,
  onNebulaChange,
  //   onAestheticChange,
  onColorCoreChange,
  onCoreColorChange,
  onRotationChange,
  onAutoRotateChange,
  onOrbitChange,
  ghostModeEnabled,
  onGhostModeChange,
  heartbeatEnabled,
  heartbeatSpeed,
  heartbeatIntensity,
  heartbeatWaveform,
  onHeartbeatChange,
  onHeartbeatSpeedChange,
  onHeartbeatIntensityChange,
  onHeartbeatWaveformChange,
}: ControlPanelProps) {
  const showChannels = nebulaEnabled || nebulaAestheticEnabled;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      onClick={collapsed ? () => setCollapsed(false) : undefined}
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(10px)",
        borderRadius: 12,
        padding: "12px 18px",
        minWidth: 280,
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
        userSelect: "none",
        zIndex: 10,
        cursor: collapsed ? "pointer" : undefined,
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCollapsed((c) => !c);
        }}
        aria-label={collapsed ? "Expand controls" : "Collapse controls"}
        style={{
          background: "none",
          border: "none",
          position: "absolute",
          top: collapsed ? "50%" : 8,
          right: collapsed ? 18 : 8,
          transform: collapsed ? "translateY(-50%)" : "none",
          color: "rgba(255, 255, 255, 0.4)",
          cursor: "pointer",
          fontSize: 14,
          padding: 0,
          lineHeight: 1,
          outline: 0,
          outlineStyle: "none",
          outlineWidth: 0,
        }}
      >
        {collapsed ? "+" : "−"}
      </button>

      {/* Show "Settings" when collapsed, dynamic title when expanded */}
      <div
        style={{
          fontSize: 10,
          opacity: 0.35,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          textAlign: "center",
          marginBottom: collapsed ? 0 : 2,
        }}
      >
        Settings
      </div>

      {/* Collapsible content */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: collapsed ? "0fr" : "1fr",
          transition: "grid-template-rows 0.3s ease",
        }}
      >
        <div
          style={{
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ControlSection
            title={showChannels ? "Nebulabrot Channels" : "Iterations"}
            defaultOpen={true}
          >
            {showChannels ? (
              <>
                <SliderRow
                  channel="r"
                  label="Red"
                  value={redIter}
                  color="#ff4444"
                  dotColor="#ff6644"
                  onUpdateIter={onUpdateIter}
                />
                <SliderRow
                  channel="g"
                  label="Green"
                  value={greenIter}
                  color="#44dd44"
                  dotColor="#44ff66"
                  onUpdateIter={onUpdateIter}
                />
                <SliderRow
                  channel="b"
                  label="Blue"
                  value={blueIter}
                  color="#4488ff"
                  dotColor="#6688ff"
                  onUpdateIter={onUpdateIter}
                />
              </>
            ) : (
              <SliderRow
                channel="max"
                label=""
                value={maxIterations}
                color="#aaa"
                dotColor="#999"
                onUpdateIter={onUpdateIter}
              />
            )}
          </ControlSection>

          <ControlSection title="Colors" defaultOpen={true}>
            <Toggle
              id="nebula-toggle"
              label="Nebulabrot color mode"
              checked={nebulaEnabled}
              onChange={onNebulaChange}
            />

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Toggle
                id="color-core-toggle"
                label="Color highlight mode"
                checked={colorCoreEnabled}
                onChange={onColorCoreChange}
                accentColor={coreColorHex}
              />
              {colorCoreEnabled && (
                <input
                  type="color"
                  value={coreColorHex}
                  onChange={(e) => onCoreColorChange(e.target.value)}
                  style={{
                    margin: 0,
                    padding: 0,
                    border: "none",
                    width: 14,
                    height: 14,
                    background: "transparent",
                    cursor: "pointer",
                  }}
                />
              )}
            </div>
          </ControlSection>

          <ControlSection title="Animation & Effects" defaultOpen={false}>
            <Toggle
              id="ghost-mode-toggle"
              label="Ghost mode (Sample Accumulation)"
              checked={ghostModeEnabled}
              onChange={onGhostModeChange}
              accentColor="#fff"
            />
            <Toggle
              id="heartbeat-toggle"
              label="Nebulabrot Pulse (Heartbeat)"
              checked={heartbeatEnabled}
              onChange={onHeartbeatChange}
              accentColor="#4488ff"
            />

            {heartbeatEnabled && (
              <div style={{ marginTop: 2, paddingLeft: 4 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 24,
                  }}
                >
                  <span
                    style={{
                      opacity: 0.5,
                      fontSize: 11,
                      width: 44,
                      textAlign: "right",
                    }}
                  >
                    Speed
                  </span>
                  <input
                    type="range"
                    min={0.1}
                    max={10.0}
                    step={0.1}
                    value={heartbeatSpeed}
                    onChange={(e) =>
                      onHeartbeatSpeedChange(Number(e.target.value))
                    }
                    style={{ width: 152, accentColor: "#4488ff", height: 4 }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 24,
                  }}
                >
                  <span
                    style={{
                      opacity: 0.5,
                      fontSize: 11,
                      width: 44,
                      textAlign: "right",
                    }}
                  >
                    Power
                  </span>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.01}
                    value={heartbeatIntensity}
                    onChange={(e) =>
                      onHeartbeatIntensityChange(Number(e.target.value))
                    }
                    style={{ width: 152, accentColor: "#4488ff", height: 4 }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    height: 24,
                    marginTop: 2,
                  }}
                >
                  <span
                    style={{
                      opacity: 0.5,
                      fontSize: 11,
                      width: 44,
                      textAlign: "right",
                    }}
                  >
                    Shape
                  </span>
                  <select
                    value={heartbeatWaveform}
                    onChange={(e) =>
                      onHeartbeatWaveformChange(
                        e.target.value as "sin" | "cos" | "tan" | "sqr",
                      )
                    }
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 4,
                      fontSize: 11,
                      padding: "2px 4px",
                      width: 152,
                      cursor: "pointer",
                    }}
                  >
                    <option value="sin" style={{ color: "black" }}>
                      Sine (Smooth)
                    </option>
                    <option value="cos" style={{ color: "black" }}>
                      Cosine (Shifted)
                    </option>
                    <option value="tan" style={{ color: "black" }}>
                      Tangent (Sharp)
                    </option>
                    <option value="sqr" style={{ color: "black" }}>
                      Square (Flash)
                    </option>
                  </select>
                </div>
              </div>
            )}
          </ControlSection>

          <ControlSection title="Geometry & Tracking" defaultOpen={false}>
            <Toggle
              id="rotation-toggle"
              label="4D rotation (Juddhabrot)"
              checked={rotationEnabled}
              onChange={onRotationChange}
              accentColor="#c084fc"
            />
            {rotationEnabled && (
              <div
                style={{
                  marginTop: 2,
                  paddingLeft: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}
              >
                <RotationSlider
                  plane="xz"
                  value={rotXZ}
                  disabled={autoRotate}
                  onUpdateRot={onUpdateRot}
                />
                <RotationSlider
                  plane="yw"
                  value={rotYW}
                  disabled={autoRotate}
                  onUpdateRot={onUpdateRot}
                />
                <Toggle
                  id="auto-rotate-toggle"
                  label="Auto-rotate"
                  checked={autoRotate}
                  onChange={onAutoRotateChange}
                  accentColor="#c084fc"
                />
              </div>
            )}

            <Toggle
              id="orbit-toggle"
              label="Orbit tracking"
              checked={orbitEnabled}
              onChange={onOrbitChange}
              accentColor="#4488ff"
            />
          </ControlSection>
        </div>
      </div>
    </div>
  );
}
