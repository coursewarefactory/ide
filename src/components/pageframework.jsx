import React, { useState, useEffect } from 'react';

import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';

import {Drawer, AppBar, Toolbar, Button, List, CssBaseline, 
        Typography, Divider, IconButton, ListItem, ListItemIcon, ListItemText
        } from '@material-ui/core';

import {FiberManualRecord, Publish, CheckCircleOutline
        } from '@material-ui/icons';

import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { fade } from '@material-ui/core/styles/colorManipulator';
import { withSnackbar } from 'notistack';


//Import Components
import PluginButton from "../components/fragments/pluginButton";
import Settings from "../components/settings";
import MonacoEditor from "../components/monacoeditor";
import HelpDialog from "../components/fragments/helpdialog";

//Import Utils
import * as API from '../js/contracting_api';
import * as LShelpers from '../js/localstorage_helpers';

const drawerWidth = 240;

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
  },
  grow: {
    flexGrow: 1
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 36,
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing.unit * 5,
    marginLeft: theme.spacing.unit * 6,
    width: '20%',
    minWidth: '250px',
    [theme.breakpoints.only('xs')]: {
      marginLeft: theme.spacing.unit * 3,
      minWidth: '200px'
    },
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing.unit * 7 + 1,
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing.unit * 9 + 1,
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
   // padding: theme.spacing.unit * 3,
  },
  statusOnline: {
    fill: 'green',
  },
  statusOffline: {
    fill: 'red',
  },
  statusPending: {
    fill: 'orange',
  },
  pluginButton: {
    [theme.breakpoints.only('xs')]: {
      display: 'none',
    }
  }
}));

function PageFramework(props) {
  const classes = useStyles();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [apiStatus, setApiStatus] = useState(undefined);
  const [windowState, setWindowState] = useState({ height: 0, width:0 });
  const [windowLoaded, setWindowLoaded] = useState(false);


  //Set Refs
  const [monacoEditor, setMonacoEditor] = useState(undefined);
  function setMonacoRef (ref){
    setMonacoEditor(ref)
  }

  useEffect(() => {
      const setFromEvent = e => setWindowState({ height: e.target.innerHeight, width: e.target.innerWidth });
      window.addEventListener('resize', setFromEvent);
      return () => {
        window.removeEventListener('resize', setFromEvent);
    }
  }, []);

  useEffect(() => {
    if (!windowLoaded){
      if (typeof window !== 'undefined' && window){
        setWindowLoaded(true)
      }
    }
  }, [windowLoaded]);

  useEffect(() => {
    if (!initialized && windowLoaded) {
      setWindowState({height: window.innerHeight, width: window.innerWidth})

      if (LShelpers.firstRun()){
        setOpenHelp(!LShelpers.firstRun());
      }
      connectToAPI();
      setInitialized(true);
    }
  }, [initialized, windowLoaded]);

  useEffect(() => {
    if (apiStatus === undefined) {return}
      props.enqueueSnackbar('API Server ' + apiStatus, { variant: apiStatus !== 'Online' ? apiStatus === 'Connecting...' ? 'info' : 'default'  : 'success' });
  }, [apiStatus]);

  function handleDrawerOpen() {
    setOpen(true);
  }

  function handleDrawerClose() {
    setOpen(false);
  }

  function toggleSettings() {
    setOpenSettings(!openSettings);
  }

  function toggleHelp() {
    setOpenHelp(!openHelp);
  }

  function connectToAPI(){
    setApiStatus('Connecting...');
    API.apicheck()
      .then(data => data === 'indeed' ? setApiStatus('Online') : setApiStatus('Offline'))
      .catch(err => handleApiError(err));
  }

  function handleApiError(error) {
    setApiStatus('Offline')
    
      if (!error){
        props.enqueueSnackbar('Unknown API Server Error', { variant: 'error' });
        return
      } 
      
      if (error.name === 'FetchError' || error.message === 'Failed to fetch'){
        props.enqueueSnackbar(error.message + '. Check API settings.', { variant: 'error' });
        return;
      }
      props.enqueueSnackbar(error.message, { variant: 'error' });
      
  }

  return (
    <div className={classes.root}>
      <CssBaseline />
      <HelpDialog openHelp={openHelp} toggleHelp={() => toggleHelp()}/> 
      {initialized ?
        <Settings initialized={initialized}
                  connectToAPI={() => connectToAPI()} 
                  openSettings={openSettings} 
                  toggleSettings={() => toggleSettings()}/>
      : null}
      <AppBar
        position="fixed"
        className={clsx(classes.appBar, {
          [classes.appBarShift]: open,
        })}
      >
        <Toolbar style={{'backgroundColor': '#512354'}}>
          <IconButton
            color="inherit"
            aria-label="Open drawer"
            onClick={() => handleDrawerOpen()}
            edge="start"
            className={clsx(classes.menuButton, {
              [classes.hide]: open,
            })}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap>
            Lamden Contracting
          </Typography>
          <div className={classes.grow} />
          <div className={classes.pluginButton}>
            <PluginButton initialized={initialized}   />
          </div>
          <Button color="inherit" onClick={() => toggleSettings()}>Settings</Button>
          <Button color="inherit" onClick={() => toggleHelp()}>Help</Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open,
        })}
        classes={{
          paper: clsx({
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open,
          }),
        }}
        open={open}
      >
        <div className={classes.toolbar}>
          <IconButton onClick={() => handleDrawerClose()}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </div>
        <Divider />
        <List>
            <ListItem key='apistatus' title={'API Connection ' + apiStatus} onClick={() => connectToAPI()}>
              <ListItemIcon> 
                <FiberManualRecord className={clsx({
                                                          [classes.statusOnline]: apiStatus === 'Online',
                                                          [classes.statusPending]: apiStatus === 'Connecting...',
                                                          [classes.statusOffline]: apiStatus === 'Offline'}
                                                        )}/>
              </ListItemIcon>
              <ListItemText primary={'API ' + apiStatus} />
            </ListItem>
            <ListItem disabled={apiStatus === 'Online' ? false : true } button key='Lint' onClick={() => monacoEditor.clickController('Lint')}>
              <ListItemIcon><CheckCircleOutline /></ListItemIcon>
              <ListItemText primary='Error Check' />
            </ListItem>
            <ListItem disabled={apiStatus === 'Online' ? false : true } button key='Submit' onClick={() => monacoEditor.clickController('Submit')}>
              <ListItemIcon><Publish /></ListItemIcon>
              <ListItemText primary='Submit' />
            </ListItem>
          </List>
      </Drawer>
      <main className={classes.content}>
        {initialized  ?
        <MonacoEditor 
          monacoRef={ref => setMonacoRef(ref)}
          apiStatus={apiStatus}
          width={open ? ((windowState.width - drawerWidth)) : windowState.width}
          height={windowState.height}
          drawerOpen = {open}
        />
        : <div><br></br><br></br><br></br><br></br><br></br><br></br><br></br>'...Loading Editor...'</div> }
      </main>
    </div>
  )
}

export default withSnackbar(PageFramework);