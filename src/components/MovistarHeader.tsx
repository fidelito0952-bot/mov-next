type Props = {
  totalLabel?: string;
  email?: string;
};

export default function MovistarHeader({ totalLabel = "0", email }: Props) {
  return (
    <header className="bg-black text-white pb-4 pt-2">
      <div className="flex justify-between items-center px-2 pt-2">
        <div className="flex items-center">
          <div className="logo-container bg-white rounded-full p-1 mr-3 w-14 h-14 flex items-center justify-center">
            <img src="/movistar/1.jpg" alt="Logo" className="h-8" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">
              Colombia Telecomunicaciones S.A. ESP
            </h1>
            <p className="text-sm text-gray-300">Pago multiples facturas Movistar</p>
            <strong className="text-sm">
              {totalLabel} <span className="text-sm">COP</span>
            </strong>
          </div>
        </div>
      </div>
      <div className="px-2 mt-4 text-center pt-3 border-t border-gray-100/50 flex justify-between">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-4"
        >
          <path
            fillRule="evenodd"
            d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z"
            clipRule="evenodd"
          />
        </svg>
        {email && <h3 className="text-sm italic">{email}</h3>}
      </div>
    </header>
  );
}
