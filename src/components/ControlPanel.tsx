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
  dotColor,
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
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${dotColor}`,
        }}
      />
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
}: ControlPanelProps) {
  const showChannels = nebulaEnabled || nebulaAestheticEnabled;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
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
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand controls" : "Collapse controls"}
        style={{
          background: "none",
          border: "none",
          position: "absolute",
          top: 8,
          right: 8,
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
        {collapsed
          ? "Settings"
          : showChannels
            ? "Nebulabrot Channels"
            : "Iterations"}
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
          }}
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

          {/* <Toggle
        id="aesthetic-toggle"
        label="Nebula palette"
        checked={nebulaAestheticEnabled}
        onChange={onAestheticChange}
        accentColor="#c084fc"
      /> */}
          <Toggle
            id="rotation-toggle"
            label="4D rotation (Juddhabrot)"
            checked={rotationEnabled}
            onChange={onRotationChange}
            accentColor="#c084fc"
          />
          <Toggle
            id="orbit-toggle"
            label="Orbit tracking"
            checked={orbitEnabled}
            onChange={onOrbitChange}
            accentColor="#4488ff"
          />

          {rotationEnabled && (
            <div style={{ marginTop: 2, paddingLeft: 4 }}>
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
        </div>
      </div>
    </div>
  );
}
