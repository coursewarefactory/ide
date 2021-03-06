import React from "react"
import PropTypes from "prop-types"

//import MainMenu from './mainmenu';
import PageFramework from "../components/pageframework"
import { SnackbarProvider } from 'notistack';



const MainLayout = ({ children }) => {
  return (
    <SnackbarProvider
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
      }}>
      <PageFramework />
    </SnackbarProvider>
    )
}


MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
}

export default MainLayout;
