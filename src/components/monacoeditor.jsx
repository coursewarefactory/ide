import React, { Component } from 'react';

import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { withSnackbar } from 'notistack';
import { Close, Add } from '@material-ui/icons';
import Paper from '@material-ui/core/Paper';

//Import Components
import ErrorBox from "../components/errorbox";
import MetaContract from "../components/metacontract";

//Import Utils
import * as API from '../js/contracting_api';
import * as LShelpers from '../js/localstorage_helpers';

import Cookies from 'universal-cookie';
const cookies = new Cookies();

const tabsHeight = 37;

const EditorContainer = (props) => {
  return <Paper
          style={{
            width: props.width ? props.width : '500px', 
            height: props.height ? props.height: '500px',
            borderTop: '2px solid #45387F', paddingTop: '10px', margin: '0px 4px 15px'
          }}
          id="editor-container"></Paper>
};

const styles = theme => ({
  root: {
    display: 'block',
    height: tabsHeight + 'px',
    marginTop: '4.25rem'
  },
  tabRow:{

  },
  tabs: {
    display: 'inline',
    height: tabsHeight + 'px',
    borderColor: '#45387F',
    padding: '5px 12px',
    marginRight: '1px',
    lineHeight: '32px',
    '&:focus': {outline:'0'}
  },
  tabButton: {
    backgroundColor: 'transparent',
    border: '0',
    '&:focus': {outline:'1px'}
  },
  tabSelected: {
    backgroundColor: '#3b42c785',
    fontWeight: 'bold',
  },
  tabUnselected: {
    backgroundColor: '#3b42c730',
  },
  tabClose: {
    height: '16px',
    position: 'relative',
    top: '3px',
    left: '8px',
    width: '16px',
  },
  newTab:{
    position: 'relative',
    top: '6px',
    margin: '0 6px 0 19px',
    fill: '#512354',
  },
  errorBoxRow:{
    height: '80%'
  },
  editorRow: {
    display: 'flex'
  },
  metaBox:{
    width: '100%',
  }
});


class MonacoWindow extends Component {
  constructor(props) { 
      super(props);
      this.state = {
        errors: '',
        models: { local: new Map(), database: new Map() },
        currentTab: {},
        apiStatus: 'Offline'
      }
      
      this.editor = null; 
      this.monaco = null;
      this.startingWords = '# Welcome to the blockchain revolution';
      this.newContractName = 'new contract ';
      this.prevStatus = 'Offline';
  }

  componentDidMount() {
    this.props.monacoRef(this);
    import("monaco-editor")
      .then( monaco => {
        this.monaco = monaco;
        this.editor = this.monaco.editor.create(document.getElementById("editor-container"), {automaticLayout: true});     
      })
  }

  componentDidUpdate(){
    if (this.props.apiStatus !== this.state.apiStatus){
      this.setState({ apiStatus: this.props.apiStatus })
    }
  }

  clickController = (action) =>{
    switch(action) {
      case "Lint":
        this.props.enqueueSnackbar('Checking contract for errors...', { variant: 'info' });
       // API.lint(this.props.ApiInfo, 'testName', this.getEditorValue()).then(data => this.handleErrors(data));
        break;
      case "Submit":
        this.props.enqueueSnackbar('Attempting to submit contract...', { variant: 'info' });
        try{
          API.submit_contract(this.props.ApiInfo, 'testName', this.getEditorValue()).then(data => this.handleErrors(data));
        } catch (e) {
          this.props.enqueueSnackbar(e.message, { variant: 'error' });
        }
        break;
      default:
        break;
    }
  }

  createNewModel = (code) => {
    return this.monaco.editor.createModel(code, 'python');
  }

  createNewTab = (name, code, source) => {
    let LsModels = LShelpers.getFiles();
    let StateModels = this.state.models;

    if (!LsModels[source].has(name)){
      const model = this.createNewModel(code);
      StateModels[source].set(name, model);
      LShelpers.setFile(name, code, source);
      this.setState({ models: StateModels, currentTab: {name, id: model.id}});
    }
      this.handleFileSwitching(name, source);
  }

  getEditorValue = () =>{
    return this.editor.getValue();
  }

  setEditorValue = (value) =>{
    this.createNewFile(value);
  }

  handleFileSwitching = (name, source) => {
    const model = this.state.models[source].get(name);
    if (model){
      this.editor.setModel(model);
      this.setState({currentTab: {name, id: model['id']}})
    }
  }

  openTab = (filename) => {
    const models = LShelpers.getFiles();
    models.forEach(model => {
      switch(model.source) {
        case "database":
          API.contract(this.props.ApiInfo, filename)
            .then(data => this.createModel(data.toString()))
            .then(model => this.setState({ models: this.state.models.set(filename, model) }));
          break;
        case "localstorage":
          if(null){return};
          break;
        default:
          break;
      }
    });
  }

  createModel = (value) => {
    const model = this.monaco.editor.createModel(value, 'python');
    this.editor.getModel(model);
    return model
  }

  newTab = () => {
    let i =1
    let done = false;
    do {
      const newName = this.newContractName + i;
      if(!this.state.models.get(newName)){
        this.createNewFile(newName, this.startingWords);
        done = true
        break;
      }else{
        if (i === 10){done = true}
      }
      i = i + 1;
    } while (!done);    
  }

  closeTab = (name) => {
    let models = this.state.models;
    models.delete(name)
    this.setState({ models }, () => {
      var openFiles = cookies.get('openfiles');
      openFiles.splice(openFiles.indexOf(name))
      cookies.set('openfiles', openFiles);
      
      const tabNames = Array.from( this.state.models.keys() );
      if (tabNames.length > 0){
        this.handleFileSwitching(tabNames[0])
      }else{
        this.createNewFile(this.newContractName + '1', this.startingWords,  );
      }
    })
  }

  parentErrors = (error) => {
    this.setState({ errors: [error] });
  }

  handleErrors = (errors) => {
    let errorsObj = {};
    try{
      errorsObj = JSON.parse(errors)      
    }catch (e){
      this.setState({ errors: [e]});
      this.props.enqueueSnackbar('Errors Found!', { variant: 'error' });
      return
    }

    if (!errorsObj.violations){
      this.setState({ errors: ['ok'] });
      if (errorsObj.success){
        this.props.enqueueSnackbar('Contract successfully submitted!', { variant: 'success' });
      }else{
        this.props.enqueueSnackbar('Contract has 0 Errors!', { variant: 'success' });

      }
      return
    }

    this.setState({ errors: errorsObj.violations});
    this.props.enqueueSnackbar(errorsObj.violations.length + ' Error(s) Found!', { variant: 'error' });

  }

  isTabSeleted = (model) => {
    if (this.state.currentTab.id === model.id) {return true}
    return false
  }

  render() {
    const { classes } = this.props;
    const width = this.props.width * 0.7;
    const height = this.props.height * 0.7;

    const tabs = []

    for (const [index, value] of this.state.models.local.entries()) {
      tabs.push(
                  <div className={classNames(classes.tabs, {
                        [classes.tabSelected]: this.isTabSeleted(value),
                        [classes.tabUnselected]: !this.isTabSeleted(value)})}
                        key={index}>
                    <button className={classNames(classes.tabButton)}
                            onClick={() =>  this.handleFileSwitching(index, 'local')}> 
                      {index} 
                    </button>
                    <Close className={classNames(classes.tabClose)} 
                           onClick={() =>  this.closeTab(index)}/>
                  </div>  
                  )
    }

    for (const [index, value] of this.state.models.database.entries()) {
      tabs.push(
                  <div className={classNames(classes.tabs, {
                        [classes.tabSelected]: this.isTabSeleted(value),
                        [classes.tabUnselected]: !this.isTabSeleted(value)})}
                        key={index}>
                    <button className={classNames(classes.tabButton)}
                            onClick={() =>  this.handleFileSwitching(index, 'database')}> 
                      { 'db: ' + index } 
                    </button>
                    <Close className={classNames(classes.tabClose)} 
                           onClick={() =>  this.closeTab(index)}/>
                  </div>  
                  )
    }
      return (
        <div className={classNames(classes.root)}>
          <div className={classNames(classes.tabRow)}>
            <span>
                <Add onClick={() =>  this.newTab()} className={classNames(classes.newTab)} />
            </span>
            <span>
              {tabs}
            </span>
          </div>
          <div className={classNames(classes.editorRow)}> 
              <span>
                <EditorContainer width={this.props.drawerOpen ? width : width - 73} height={height} className="monaco-window" />
              </span>
              <span className={classNames(classes.metaBox)}>
                <MetaContract 
                  apiStatus={this.state.apiStatus}
                  methods={this.state.methods}
                  variables={this.state.variables}
                  openCode={(name, code, source) => this.createNewTab(name, code, source)}
                  height={height ? height : '500px'}
                />
              </span>
            </div>
            <div className={classNames(classes.errorBoxRow)}>
            <ErrorBox errors={this.state.errors} />
            </div>
        </div>
      );
  }
}

MonacoWindow.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(withSnackbar(MonacoWindow));