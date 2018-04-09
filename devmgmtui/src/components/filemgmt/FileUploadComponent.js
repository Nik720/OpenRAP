import React, { Component } from 'react'
import { connect } from 'react-redux'
import * as actions from '../../actions/filemgmt'
import { Button, Icon, Segment } from 'semantic-ui-react'
import SelectedFileShowComponent from './SelectedFileShowComponent'


class FileUploadComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      autoUpload : false,
      usbConnected : false,
      isUploadingToUsb : false,
      isDownloadingFromUsb : false,
    }
  }

  handleFileInputChange(fileList)  {
    let files = this.props.filemgmt.uploadableFiles;
    for (let i = 0; i < fileList.length; i++) {
      files.push(fileList[i]);
    }
    this.props.updateUploadableFiles(files);
    //this.setState({files, fileNames});
  }

  enableAutomaticUpload() {
    this.setState({autoUpload : true})
  }

  componentDidMount() {
    this.props.readFolder(this.props.filemgmt.currentDir);
    this.props.verifyConnectedUSB('', (ans) => {
      this.setState({usbConnected : ans});
    });
  }

  componentDidUpdate(newProps, newState) {
    if (newState.autoUpload === true) {
      this.setState({autoUpload : false})
    }
  }

  transferToUSB() {
    this.props.verifyConnectedUSB('', (ans) => {
      if (!ans) {
        alert('USB unplugged!');
        this.setState({usbConnected : false});
      } else {
        this.setState({isUploadingToUsb : true})
        this.props.copyFile(this.props.filemgmt.currentDir, this.props.filemgmt.usbDir, (err, msg) => {
          if (err) {
            alert(msg);
          } else {
            alert('Copy to USB successful!');
          }
          this.props.verifyConnectedUSB((ans) => {
            return;
          })
          this.setState({isUploadingToUsb : false})
        })
      }
    });
  }

  transferFromUSB() {
    this.props.verifyConnectedUSB('', (ans) => {
      if (!ans) {
        alert('USB unplugged!');
        this.setState({usbConnected : false});
      } else {
        this.setState({isDownloadingFromUsb : true})
        this.props.copyBunchOfFiles(this.props.filemgmt.usbDir, this.props.filemgmt.usbDownFiles, this.props.filemgmt.currentDir, (msg) => {
          alert(msg);
          this.props.verifyConnectedUSB((ans) => {
            return;
          })
          this.props.readFolder(this.props.filemgmt.currentDir);
          this.setState({isDownloadingFromUsb : false})
        })
      }
    })
  }

  renderFileUploadComponent() {
    let fileNameDOMs = this.props.filemgmt.uploadableFiles.map((thing, index) =>
        <div>
          <SelectedFileShowComponent file = {thing} uploadStatus={this.state.autoUpload ? 'UPLOADING' : 'INACTIVE'} key={index}/>
        </div>)
    return (
      <div>
        <Segment>
        <span>
        <Button animated color='teal' onClick={this.transferToUSB.bind(this)} disabled = {!this.state.usbConnected || this.state.isUploadingToUsb} loading={this.state.isUploadingToUsb}>
          <Button.Content visible>Transfer Folder to USB</Button.Content>
          <Button.Content hidden><Icon name='usb' /><Icon name='up arrow'/></Button.Content>
        </Button>
        <Button animated color='teal' onClick={this.transferFromUSB.bind(this)} disabled = {!this.state.usbConnected || this.state.isDownloadingFromUsb} loading={this.state.isDownloadingFromUsb}>
          <Button.Content visible>Transfer Here From USB</Button.Content>
          <Button.Content hidden><Icon name='usb' /><Icon name='down arrow'/></Button.Content>
        </Button>
        </span>
        </Segment>
        <Segment>
        <span>
          <Button animated color='blue' onClick = {() => {
            document.getElementById("fileinput").click();
          }}>
            <Button.Content visible>
              Choose file(s) to upload
            </Button.Content>
            <Button.Content hidden>
              <Icon name='upload' />
            </Button.Content>
          </Button>
          <input type='file' id='fileinput' style = {{display : 'None'}}
          onChange={(e) => this.handleFileInputChange(e.target.files)} multiple/>
        </span>
        <span>
          <Button animated color='blue' onClick = {() => {
            document.getElementById("folderinput").click();
          }}>
            <Button.Content visible>
              Choose folder(s) to upload
            </Button.Content>
            <Button.Content hidden>
              <Icon name='upload' />
            </Button.Content>
          </Button>
          <input type='file' id='folderinput' style = {{display : 'None'}}
          onChange={(e) => this.handleFileInputChange(e.target.files)} multiple='' webkitdirectory='' mozdirectory='' directory=''/>
        </span>
        <span>
        { this.props.filemgmt.uploadableFiles.length > 0 ? <Button animated color='green' onClick = {this.enableAutomaticUpload.bind(this)}>
          <Button.Content visible>
            Upload all files
          </Button.Content>
          <Button.Content hidden>
            <Icon name='checkmark' />
          </Button.Content>
        </Button> : null}
        </span>
        <div className='ui divider'></div>
        {this.props.filemgmt.uploadableFiles.length > 0 ? <h2>Selected files for upload</h2> : null}
        <br/>
        {fileNameDOMs}
        </Segment>
      </div>
    )
  }

  render() {
    return (
      <div>
        {this.renderFileUploadComponent()}
      </div>
    )
  }
}

function mapStateToProps({ filemgmt }) {
  return { filemgmt }
}

export default connect(mapStateToProps, actions)(FileUploadComponent);
