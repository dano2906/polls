interface Props {
	pollId: string | null;
}

const CreateQuestionForm = ({ pollId }: Props) => {
	return <div>CreateQuestionForm {pollId}</div>;
};

export default CreateQuestionForm;
