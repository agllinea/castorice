import { IconChevronDown } from "@tabler/icons-react";
import { motion } from "motion/react";
import type { ButtonHTMLAttributes, ElementType, HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from "react";
import { Badge as BaseBadge } from "./badge";
import { Button as BaseButton } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import { Input } from "./input";
import { Select as BaseSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Textarea as BaseTextarea } from "./textarea";
import { Tooltip as BaseTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import "./ui.css";

type LegacySize = "xs" | "sm" | "md" | "lg" | "compact-xs" | "compact-sm";
type LegacyVariant = "filled" | "light" | "subtle" | "outline" | "default";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
	size?: LegacySize;
	variant?: LegacyVariant;
	color?: string;
	disabled?: boolean;
	loading?: boolean;
	leftSection?: ReactNode;
	isIconOnly?: boolean;
}

function buttonVariant(variant?: LegacyVariant) {
	if (variant === "filled") return "default" as const;
	if (variant === "light") return "secondary" as const;
	if (variant === "outline" || variant === "default") return "outline" as const;
	return "ghost" as const;
}

function buttonSize(size: LegacySize, iconOnly?: boolean) {
	if (iconOnly) return size === "xs" || size === "compact-xs" ? "icon-xs" as const : size === "lg" ? "icon-lg" as const : "icon-sm" as const;
	if (size === "lg") return "lg" as const;
	if (size === "sm" || size === "compact-sm") return "sm" as const;
	if (size === "xs" || size === "compact-xs") return "xs" as const;
	return "default" as const;
}

export function Button({ children, className = "", size = "md", variant = "filled", color, disabled, loading, leftSection, isIconOnly, ...props }: ButtonProps) {
	const resolvedVariant = buttonVariant(variant);
	return <BaseButton {...props} className={`ui-button ui-button-${size} ${color ? `ui-color-${color}` : ""} ${className}`} size={buttonSize(size, isIconOnly)} variant={resolvedVariant} data-variant={resolvedVariant} data-ui-appearance={variant} data-ui-color={color} disabled={disabled || loading}>
		{loading ? <span className="ui-spinner" aria-hidden="true" /> : leftSection}{children}
	</BaseButton>;
}

interface ActionIconProps extends Omit<ButtonProps, "leftSection"> { "aria-label": string }
export function ActionIcon({ children, className = "", ...props }: ActionIconProps) {
	return <Button {...props} className={`ui-icon-button ${className}`} isIconOnly>{children}</Button>;
}

interface BadgeProps { children: ReactNode; className?: string; color?: string; size?: "xs" | "sm" | "md" | "lg"; variant?: "filled" | "light" }
export function Badge({ children, className = "", color = "default", size = "md", variant = "light" }: BadgeProps) {
	const badgeVariant = color === "red" ? "destructive" : variant === "filled" ? "default" : color === "default" || color === "gray" ? "secondary" : "outline";
	return <BaseBadge className={`ui-badge ui-badge-${size} ui-color-${color} ${className}`} variant={badgeVariant}>{children}</BaseBadge>;
}

interface PaperProps extends HTMLAttributes<HTMLDivElement> { component?: ElementType; radius?: string | number; shadow?: string }
export function Paper({ children, className = "", component: Component = "div", radius, shadow, ...props }: PaperProps) {
	return <Component {...props} className={`ui-surface ${className}`} style={{ ...props.style, borderRadius: radius === 0 ? 0 : undefined }} data-shadow={shadow}>{children}</Component>;
}

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> { size?: LegacySize; radius?: string; leftSection?: ReactNode }
export function TextInput({ className = "", leftSection, size = "md", radius: _radius, ...props }: TextInputProps) {
	void _radius;
	return <div className={`ui-input-wrap ui-input-${size} ${leftSection ? "has-leading" : ""} ${className}`}>{leftSection ? <span className="ui-input-leading">{leftSection}</span> : null}<Input {...props} className="ui-input" /></div>;
}

interface SelectOption { value: string; label: string }
interface SelectProps { className?: string; value: string; data: SelectOption[]; onChange: (value: string | null) => void; "aria-label"?: string; leftSection?: ReactNode; size?: LegacySize; radius?: string; allowDeselect?: boolean }
export function Select({ className = "", value, data, onChange, leftSection, size = "md", ...props }: SelectProps) {
	return <div className={`ui-select ui-select-${size} ${className}`}>
		<BaseSelect value={value} onValueChange={(next) => onChange(next == null ? null : String(next))}>
			<SelectTrigger aria-label={props["aria-label"]} className="ui-select-trigger">
				{leftSection ? <span className="ui-select-leading">{leftSection}</span> : null}
				<SelectValue>{data.find((item) => item.value === value)?.label}</SelectValue>
			</SelectTrigger>
			<SelectContent className="ui-select-popover" align="start" alignItemWithTrigger={false}>
				{data.map((item) => <SelectItem className="ui-select-option" key={item.value || "__all__"} value={item.value}>{item.label}</SelectItem>)}
			</SelectContent>
		</BaseSelect>
	</div>;
}

interface TooltipProps { children: ReactElement; label: ReactNode; withArrow?: boolean; color?: string }
export function Tooltip({ children, label }: TooltipProps) {
	return <TooltipProvider delay={250}><BaseTooltip><TooltipTrigger render={children} /><TooltipContent>{label}</TooltipContent></BaseTooltip></TooltipProvider>;
}

interface ModalProps { opened: boolean; onClose: () => void; title: ReactNode; children: ReactNode; size?: "sm" | "md" | "lg" | "xl"; centered?: boolean; overlayProps?: unknown }
export function Modal({ opened, onClose, title, children, size = "md", centered: _centered, overlayProps: _overlayProps }: ModalProps) {
	void _centered; void _overlayProps;
	return <Dialog open={opened} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className={`ui-dialog ui-dialog-${size}`}>
		<DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
		<div className="ui-dialog-body">{children}</div>
	</DialogContent></Dialog>;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { autosize?: boolean; minRows?: number; maxRows?: number }
export function Textarea({ className = "", autosize, minRows = 3, maxRows: _maxRows, ...props }: TextareaProps) {
	void _maxRows;
	return <BaseTextarea {...props} className={`ui-textarea ${autosize ? "is-autosize" : ""} ${className}`} rows={minRows} />;
}

interface SegmentedControlProps<T extends string> { value: T; onChange: (value: string) => void; data: Array<{ value: T; label: ReactNode }>; fullWidth?: boolean }
export function SegmentedControl<T extends string>({ value, onChange, data, fullWidth }: SegmentedControlProps<T>) {
	return <div className={`ui-segmented ${fullWidth ? "is-full-width" : ""}`} role="radiogroup">{data.map((item) => <BaseButton key={item.value} type="button" variant="ghost" size="sm" className={value === item.value ? "is-active" : ""} role="radio" aria-checked={value === item.value} onClick={() => onChange(item.value)}>
		{value === item.value ? <motion.span className="ui-segmented-indicator" layoutId="ui-segmented-indicator" transition={{ type: "spring", stiffness: 520, damping: 38 }} /> : null}<span>{item.label}</span>
	</BaseButton>)}</div>;
}

interface NavLinkProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> { active?: boolean; label: ReactNode; color?: string; variant?: string; component?: string }
export function NavLink({ active, label, className = "", component: _component, color: _color, variant: _variant, ...props }: NavLinkProps) {
	void _component; void _color; void _variant;
	return <BaseButton {...props} type="button" variant="ghost" size="sm" className={`ui-nav-link ${active ? "is-active" : ""} ${className}`}>{label}</BaseButton>;
}

interface InteractiveSurfaceProps extends HTMLAttributes<HTMLDivElement> { disabled?: boolean; onActivate?: () => void }
export function InteractiveSurface({ children, className = "", disabled = false, onActivate, onClick, onKeyDown, ...props }: InteractiveSurfaceProps) {
	const activateFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
		onKeyDown?.(event);
		if (!event.defaultPrevented && !disabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onActivate?.(); }
	};
	return <div {...props} className={`ui-interactive-surface ${className}`} role="button" aria-disabled={disabled || undefined} tabIndex={disabled ? -1 : 0} onClick={(event) => { onClick?.(event); if (!event.defaultPrevented && !disabled) onActivate?.(); }} onKeyDown={activateFromKeyboard}>{children}</div>;
}

interface MenuItem { label: ReactNode; onClick: () => void; id?: string }
interface MenuButtonProps { label: ReactNode; items: MenuItem[]; align?: "start" | "end"; active?: boolean; className?: string }
export function MenuButton({ label, items, align = "start", active, className = "" }: MenuButtonProps) {
	return <DropdownMenu><DropdownMenuTrigger render={<BaseButton type="button" variant="ghost" size="sm" className={`ui-menu-trigger ${active ? "is-active" : ""} ${className}`} />}>
		{label}<IconChevronDown size={13} />
	</DropdownMenuTrigger><DropdownMenuContent className="ui-menu-popover" align={align}>{items.map((item, index) => <DropdownMenuItem className="ui-menu-option" key={item.id ?? String(index)} onClick={item.onClick}>{item.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>;
}
