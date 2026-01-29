
const Navbar = () => {
  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-400 to-purple-500 rounded-lg transform rotate-45">
              <div className="absolute inset-0.5 bg-gray-900 rounded">
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-purple-500">$</span>
                </div>
              </div>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 rounded-full"></div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="h-px w-4 bg-white mr-2"></span>
              <h1 className="text-2xl font-bold">FGC</h1>
              <span className="h-px w-4 bg-white ml-2"></span>
            </div>
            <div className="flex">
              <span className="text-teal-400 font-bold">MONEY</span>
              <span className="text-purple-500 font-bold">MATCH</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex space-x-6">
          <a href="#" className="hover:text-teal-400 transition-colors">Home</a>
          <a href="#" className="hover:text-teal-400 transition-colors">Tournaments</a>
          <a href="#" className="hover:text-teal-400 transition-colors">Leaderboard</a>
          <a href="#" className="hover:text-teal-400 transition-colors">About</a>
        </div>
        
        <button className="bg-gradient-to-r from-teal-400 to-purple-500 text-black px-6 py-2 rounded-full font-bold hover:opacity-90 transition-opacity">
          Sign In
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
