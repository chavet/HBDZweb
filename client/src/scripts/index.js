function LoginInfo() {
	this.userid = "";
	this.password = "";
	function getCookie(name, strCookie) {
		var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
		if (arr = strCookie.match(reg))
			return unescape(arr[2]);
		else
			return null;
	}
	this.userid = getCookie("userid", document.cookie);
	this.password = getCookie("password", document.cookie);  
}
	
function CreateControls(){
	//底部面板
    var south = new Ext.Panel({
        region: "south",
        el: 'south',
        height: 25,
        html: '<div style="float:left;margin:5px;font:normal 12px tahoma, arial, sans-serif, 宋体;">CopyRight(C)：<span style="color:blue">LaviMap</span>&nbsp;</div><div style="float:right;margin:5px;font:normal 12px tahoma, arial, sans-serif, 宋体;">联系方式&nbsp;&nbsp;<span style="color:red">+86-27-86816665</span></div>'
    });
    //中间显示的主区域
    var tab = new Ext.Panel({
        region: 'center',
        el: 'center',
        layout: 'border',
        activeTab: 0,
        resizeTabs: true, //大小是否可变
        minTabWidth: 115, //标签最小宽度
        tabWidth: 135,
        items: [
            {
                region: 'center',
                layout: 'fit',
                //title: '建设项目分布图',
                html: '<iframe scrolling="auto" frameborder="0" width="100%" height="100%" src="./jsxmfbt.aspx"></iframe>'
            }
        ],
        enableTabScroll: true
    });

    new Ext.Viewport({//浏览器可视区域
        layout: "border", //border布局把容器分成东南西北中五个区域，分别由east，south, west，north, cente来表示，在往容器中添加子元素的时候，我们只需要指定这些子元素所在的位置，Border布局会自动把子元素放到布局指定的位置
        items: [south, tab]//
    });
}


Ext.onReady(function () {
    

	//?userid=ycct&password=ycct
	function getQueryString(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) return unescape(r[2]); return null;
	}
	//先获取参数
	var userid = getQueryString("userid")
	var password = getQueryString("password")
	if (userid && password) {
		//用户和密码保存到cookie
		document.cookie = "userid=" + userid;
		document.cookie = "password=" + password;
		//修改当前路径，
		location.href = document.URL.substr(0,document.URL.indexOf("?")) ;//
	}
	else {
		var li = new LoginInfo();
		if ( (!li.userid || !li.password) || 
			(li.userid.length == 0 || li.password.length == 0)) {
			CreateControls();
		}
		else{
			//alert("用户名："+li.userid);
			//alert("密码：" + li.password);
			//创建控件
			CreateControls();
		}
	}

});