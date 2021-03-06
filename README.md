# Qlik Sense Authentication module with Slack

Qlik Sense NodeJs module to authenticate with Slack in Qlik Sense.

## Setup step by step
---
### Slack App registration
1. Go to Slack API Portal and Create a new Application https://api.slack.com/apps.

![](https://github.com/mjromper/qlik-auth-slack/raw/master/docs/images/createapp.png)
2. You'll be given an Client Id and Client Secret. This will be your **client_id** and **client_secret** Copy these values somewhere for later.

![](https://github.com/mjromper/qlik-auth-slack/raw/master/docs/images/generatepassword.png)
3. Click on "Oauth and Permissions" and set the redirect URI. Select a port number at your choice (different from the ones already in used by Qlik Sense). **https://your_sense_server_host:8085/oauth2callback**

![](https://github.com/mjromper/qlik-auth-slack/raw/master/docs/images/webapplicationredirect.png)
4. Save your changes.


### Installation of this module

* Launch PowerShell in Administrator mode (right-click and select Run As Administrator)
* Create and change directory to an empty directory, i.e. C:\TempSlack

```powershell
    mkdir \TempSlack; cd \TempSlack
```

* Enter the below command exactly as it is (including parentheses):

```powershell
    (Invoke-WebRequest "https://raw.githubusercontent.com/mjromper/qlik-auth-slack/master/setup.ps1" -OutFile setup.ps1) | .\setup.ps1
```

This will download and execute the setup script.

When the downloading and installation of the modules including their dependencies are finished you will be prompted for some configuration options.

```
Enter name of user directory [SLACK]:
Enter port [8085]:
Application ID []: enter your **client_id** value
Client Secret []: enter your **client_secret** value
Slack Team (Optional) []:
```

- ***port***: *the same used for the redirect URI at the Microsoft Application Registration Portal*
- ***directory***: *give a name for the Directory in Qlik Sense where you users will be authorized*

When the script is finished you need to restart Qlik ServiceDispacher service.

### Qlik Sense Virtual Proxy
1. Create a new Virtual Proxy in QMC
2. For Authentication module redirect URI enter the same ***servername*** and ***port*** you used for Authorized redirect URI in the Application Registration Portal.

![](https://github.com/mjromper/qlik-auth-slack/raw/master/docs/images/virtual-proxy.png)
3. Finish the Virtual Proxy configuration. The proxy will restart and the new module should be good to go!. Open the url https://your_sense_server_host/slack (where 'slack' is the prefix of virtual proxy)

### Todos
 - Write Tests

License
----

MIT
