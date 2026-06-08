const PageHeading = ({ children }: { children: React.ReactNode }) => {
	return (
		<h2 className="font-sgc text-4xl font-semibold tracking-wide text-foreground">
			{children}
		</h2>
	);
};

export default PageHeading;
