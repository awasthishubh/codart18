function printresponse(json){
    $('#response').html('')
    console.log(json)
    a=JSON.stringify(json,undefined,4)
    console.log(a)
    $('#response').html(a)
}

function getQues(){
    $.get('/assign',function(data){
        $('#questions').html(JSON.stringify(data,undefined,4))
    })
}

function getParticipant(){
    $.get('/participants',function(data){
        $('#participant').html(JSON.stringify(data,undefined,4))
    })
}

function getQueue(noRes){
    $.get('/queue',function(data){
        $('#dartQueue').html(JSON.stringify(data,undefined,4))
    })
}

function insertQueue(){
    printresponse({})
    $.ajax({
        url:'/queue',
        type:'POST',
        data:{team:$('#teamToQueue').val()}
    }).done(function(data){
        getQueue()
        printresponse(data)
    }).catch((e)=>{
        printresponse(JSON.parse(e.responseText))
    })
}

function assign(){
    printresponse({})
    $.ajax({
        url:'/assign',
        type:'POST',
        data:{level:$('#level2assign').val()}
    }).done(function(data){
        console.log(data)
        printresponse(data)
        getQues()
        getQueue()
    }).catch((e)=>{
        printresponse(JSON.parse(e.responseText))
        getQueue()
    })
}

function delAssign(){
    printresponse({})
    $.ajax({
        url:'/assign',
        type:'DELETE',
        data:{qid:$('#q2del').val(),team:$('#team2del').val()}
    }).done(function(data){
        printresponse(data)
        getQues()
    }).catch((e)=>{
        printresponse(JSON.parse(e.responseText))
    })
}

function delQueue(){
    printresponse({})
    $.ajax({
        url:'/queue',
        type:'DELETE',
    }).done(function(data){
        printresponse(data)
        getQueue()
    }).catch((e)=>{
        printresponse(JSON.parse(e.responseText))
    })
}

getQues()
getQueue()