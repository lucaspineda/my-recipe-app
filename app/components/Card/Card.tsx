import Button from "../Button/Button";

interface CardProps {
  children: React.ReactNode;
  buttonColor: string;
  handleButtonClick: () => void;
  buttonText: string;
}

export default function Card({
  children,
  buttonColor,
  handleButtonClick,
  buttonText,
}: CardProps) {
  const handleCancelPlan = async () => {
    handleButtonClick();
  };
  return (
    <>
      <div className="flex flex-col bg-white rounded-md py-4 px-8">
        {children}
        <Button
          text={buttonText}
          loading={false}
          className={`${buttonColor} mt-6 py-2 px-4 w-min text-white rounded-md border-none shadow-lg self-center`}
          onClick={handleCancelPlan}
        />
      </div>
    </>
  );
}
