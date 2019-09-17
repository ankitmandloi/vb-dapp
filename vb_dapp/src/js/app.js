App = {
     web3Provider: null,
     contracts: {},
     account:0x0,
     loading:false,

     init: function() {

          return App.initWeb3();
     },

     initWeb3: function() {
         if(typeof web3!=='undefined')
         {
           App.web3Provider=web3.currentProvider;
         }
         else
         {
           App.web3Provider=new Web3.providers.HttpProvider('http://localhost:7545')
         }

         web3=new Web3(App.web3Provider);

          App.displayAccountInfo();

          return App.initContract();
     },


        displayAccountInfo: function(){
          web3.eth.getCoinbase(function(err,account){
            if(err ===null){
              App.account=account;
              $('#account').text(account);
              web3.eth.getBalance(account ,function(err,balance){
                if(err==null){
                  $('#accountBalance').text(web3.fromWei(balance,"ether") + " ETH");
                }
              })
            }
          })
        },

     initContract: function() {
     $.getJSON('Elect.json',function(electArtifact){
       App.contracts.Elect = TruffleContract(electArtifact);

       App.contracts.Elect.setProvider(App.web3Provider);

       App.listenToEvents();
       return App.reloadInfo();


     });
     },

     reloadInfo :function(){

       if(App.loading){
         return;
       }
       App.loading=true;

      App.displayAccountInfo();

      var electInstance;

      App.contracts.Elect.deployed().then(function(instance){
        electInstance=instance;
        return electInstance.getCandidateRequesting();

      }).then(function(candidateIds){
                          $('#voteRequest').empty();
                        for(var i=0;i<candidateIds.length; i++){
                          var candidateId=candidateIds[i];
                          electInstance.candidates(candidateId.toNumber()).then(function(candidate){
                            App.displayCandidate(candidate[5],candidate[1],candidate[5],candidate[1]);
                          });
                        }
                        App.loading=false;
          }).catch(function(err){
            console.log(err);
            App.loading=false;
          })
     },
     displayCandidate:function(value,id,candidate,name,description){
       var  voteRequest=$('#voteRequest');
       var etherPrice = web3.fromWei(value,"ether");

       var  requestTemplate=$('#requestTemplate');
       requestTemplate.find('.panel-title').text(name);
       requestTemplate.find('.request-description').text(description);
       requestTemplate.find('.request-value').text(etherPrice +"ETH");
       requestTemplate.find('.btn-vote').attr('data-id',id);
       requestTemplate.find('.btn-vote').attr('data-value',etherPrice);

           if(candidate==App.account){
             requestTemplate.find('.request_id').text("You");
             requestTemplate.find('.btn-vote').hide();

           }else{
             requestTemplate.find('.request_id').text(candidate);
             requestTemplate.find('.btn-vote').show();
           }

           voteRequest.append(requestTemplate.html())


     },

      voteRequest: function()
      {

    var _candidate_name=$('#candidate_name').val();
    var _candidate_description = $('#candidate_description').val();
    var _candidate_value=web3.toWei(parseFloat($('#candidate_value').val() || 0),"ether");

    if(_candidate_name.trim() =='' || (_candidate_value==0)){
      return false;
    }

    App.contracts.Elect.deployed().then(function(instance){
  return instance.voteRequest(_candidate_name,_candidate_description,_candidate_value,{
    from:App.account,
    gas:500000
  });
}).then(function(result){

}).catch(function(err){

console.error(err);
})
},
listenToEvents:function(){
    App.contracts.Elect.deployed().then(function(instance){
      instance.LogRequests({},{}).watch(function(error,event){
        if(!error){
          $("#events").append('<li class="list-group-item">' + event.args._candidate_value + 'is now for voting </li>')
        }else{
          console.log("Hello")
        }
        App.reloadInfo();
      })
    })

},

voteFor: function() {
  event.preventDefault();

  var _candidateId=$(".btn-vote").attr('data-id');

  var _value = $(".btn-vote").attr('data-value');
  alert(_value)

  App.contracts.Elect.deployed().then(function(instance){
    return instance.voteFor(_candidateId,{
      from: App.account,
      value: web3.toWei(_value, "ether"),
      gas: 500000
    });
  }).catch(function(error) {
    console.error(error);
  });
}

};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
