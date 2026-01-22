import './App.css'
import uva from './assets/uva.png'

function App() {
  return (
    <>
      <div>
        <a href="https://www.virginia.edu" target="_blank">
          <img
            src={uva}
            className="logo"
            alt="UVA logo"
          />
        </a>
      </div>
      <h1 className="title">Baby Diagnostics</h1>
    </>
  )
}

export default App
