import { Link, useRouteContext } from "@tanstack/react-router";
import { FileTextIcon } from "lucide-react";
import { buttonVariants } from "../ui/button";

interface Props {
	slug: string | null;
}

const GoToPollLink = ({ slug }: Props) => {
	const { auth } = useRouteContext({ from: "__root__" });
	return (
		<Link
			to="/p/$slug"
			params={{
				slug: slug as string,
			}}
			disabled={!auth?.session}
			className={`${(!auth || !auth?.session) && "cursor-not-allowed"} ${buttonVariants(
				{
					variant: "default",
					size: "icon-sm",
				},
			)}`}
		>
			<FileTextIcon />
		</Link>
	);
};

export default GoToPollLink;
