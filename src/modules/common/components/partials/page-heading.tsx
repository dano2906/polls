interface PageHeadingProps {
	children: React.ReactNode;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	as?: "h1" | "h2" | "h3" | "h4";
	className?: string;
}

const sizeClasses = {
	xs: "text-2xl",
	sm: "text-3xl",
	md: "text-4xl",
	lg: "text-5xl",
	xl: "text-6xl",
} as const;

const PageHeading = ({
	children,
	size = "md",
	as: Tag = "h2",
	className,
}: PageHeadingProps) => {
	return (
		<Tag
			className={`font-sgc font-semibold tracking-wide text-foreground ${sizeClasses[size]} ${className ?? ""}`}
		>
			{children}
		</Tag>
	);
};

export default PageHeading;
