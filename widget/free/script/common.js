/**
* 封装 api.openWin
* string name   win文件名
* json pageParam (可选)传参 api.pageParam，可忽略，直接传第三参数
* boolen isLogin (可选)是否需要检查登陆状态
* json params   (可选)openWin其他属性参数
**/
function openWin(name, pageParam, isLogin, params) {
    if (typeof(pageParam) === 'boolean') {
        params = isLogin;
        isLogin = pageParam;
        pageParam = {};
    }
    //检查登陆状态
    if (isLogin && api.getPrefs({sync: true, key: 'iduser'}) === undefined) {
        openWin('login');
        return;
    }
    params = params || {};
    params.name = name;
    params.url = 'widget://free/' + name + '.html';
    params.pageParam = pageParam;
    params.slidBackType = 'edge';
    api.openWin(params);
}

function openBar(name, isLogin) {
    openWin(name, isLogin, {
        slidBackEnabled: false,
        animation: {type:'none'},
    });
}

/**
* 链接解析，用于服务器链接智能识别，如，app内web和本地win页面互跳，外部浏览器唤醒本app。
* 1、app协议：app://?a=1&b=2，2、http/https协议：https://www.mmyya.com?a=1&b=2
* string url    跳转链接
* string title  (可选)标题
**/
function aLink(url, title) {
    if (url === '') return false;
    var pageParam = {};
    //app协议网址
    if(url.indexOf(scheme_url) === 0){
        pageParam = url.slice(scheme_url.length+1).split('&').reduce(function(res, item){
            query = item.split('=')
            res[query[0]] = query[1];
            return res;
        }, {});
    //正常网址
    }else{
        pageParam = {
            '@': 'web',
            url: url
        }
    }
    pageParam.title = title || '';
    openWin(pageParam['@'], pageParam);
}

//打开浮层
function openDialog(frm, params){
    api.openFrame({
        name: frm,
        url: 'widget://free/html/'+ frm +'.html',
        pageParam: params,
        rect:{x:0, y:0, w:'auto', h:'auto'},
        bgColor: 'rgba(0,0,0,0.5)',
        bounces: false,
    });
}

//打开播放页
function openPlayer(vid, tid){
    var url = 'app/video/'+ vid;
    if (tid > 1){
        //vip视频先登录
        if ($api.getStorage('token') === undefined) {
            openDialog('login');
            return false;
        }
        url = 'my/video/'+ vid;
    }
    //检查视频是否需要购买
    $api.get(url, function(data){
        var name = api.systemType === 'ios' ? 'player' : 'x5';
        api.openWin({
            name: name,
            url: 'widget://free/'+ name +'.html',
            pageParam: data,
            reload: true,
        });
    },function(data){
        if(data.code === -1){
            openDialog('login');
        }else{
            new auiToast().fail({title:data.msg});
        }
    });
}
//登陆登出刷新
function LoginOut(fn1, fn2){
    //接受登陆监听
    api.addEventListener({
        name: 'islogin'
    }, function(ret, err){
        if(ret){
            window.scrollTo(0,0);
            fn1();
        }
    });
    //接受退出监听
    api.addEventListener({
        name: 'logout'
    }, function(ret, err){
        if(ret){
            window.scrollTo(0,0);
            fn2 ? fn2() : fn1();
        }
    });
}
/**
* 上拉加载更多
* function fn   (可选)function=添加监听，undefined=移除监听
**/
function loadMore(fn){
    if (typeof(fn) === 'function') {
        //添加上拉加载监听
        api.addEventListener({
            name: 'scrolltobottom'
        }, function(){
            fn();
        });
    }else{
        //移除上拉加载监听
        api.removeEventListener({ name: 'scrolltobottom' });
    }
}
//下拉刷新
function pullRefresh(){
    api.refreshHeaderLoadDone();
    var load = [];
    for (var i = 1; i < 10; i++) {
        load.push('widget://free/image/loading'+ i +'.png');
    }
    api.setCustomRefreshHeaderInfo({
        bgColor: '#F5F5F5',
        image: {
            pull: ['widget://free/image/pullRefresh.png'],
            load: load,
        }
    }, function() {
        setTimeout(function(){
            api.refreshHeaderLoadDone();
            location.reload();
        }, 1500);
    });
}

/**
* 监听广播事件，可广播到多个指定页面
* array|undefined arrName   (可选)广播到指定页面
* function fn   (可选)默认刷新，可自定义监听事件
**/
function reload(arrName, fn) {
    if(arrName === undefined) {
        api.addEventListener({
            name: 'reload'
        }, function(ret, err){
            if(ret && ret.value && ret.value.name.indexOf(api.frameName) > -1){
                fn ? fn() : location.reload();
            }
        });
    } else {
        api.sendEvent({
            name: 'reload',
            extra: {name: arrName}
        });
    }
}
