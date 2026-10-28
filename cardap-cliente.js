(() => {
  const stores=['Quintal da Mesa','Ponto do Burger','Forno & Massa','Café da Esquina','Doce Encontro','Tempero de Casa'];
  const userKey='cardap-demo-user';
  const read=(storage,key,fallback)=>{try{return JSON.parse(storage.getItem(key))??fallback;}catch{return fallback;}};
  const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(cents/100);
  const validItems=items=>Array.isArray(items)?items.filter(item=>item && typeof item.name==='string' && Number.isInteger(item.quantity) && item.quantity>0 && item.quantity<=99 && Number.isFinite(item.price) && item.price>0 && item.price<100000):[];
  const createEntry=(title,description,label,href)=>{
    const article=document.createElement('article');article.className='account-entry';
    const heading=document.createElement('h3');heading.textContent=title;
    const text=document.createElement('p');text.textContent=description;
    const link=document.createElement('a');link.href=href;link.textContent=label;
    article.append(heading,text,link);return article;
  };
  const getUser=()=>{const user=read(sessionStorage,userKey,null);return user?.id==='demo-customer' && user?.demo===true && typeof user.name==='string' && typeof user.email==='string'?user:null;};
  const render=()=>{
    const user=getUser();
    document.querySelector('#guest').hidden=!!user;
    document.querySelector('#account').hidden=!user;
    document.querySelector('#welcome').textContent=user?'Olá, '+user.name+'.':'Sua área no Cardap';
    if(!user)return;
    document.querySelector('#account-name').textContent=user.name;
    document.querySelector('#account-email').textContent=user.email;
    document.querySelector('#profile-name').value=user.name;
    document.querySelector('#profile-email').value=user.email;
    const carts=document.querySelector('#cart-list');const orders=document.querySelector('#order-list');carts.replaceChildren();orders.replaceChildren();
    let itemCount=0;let orderCount=0;
    stores.forEach(store=>{
      const encoded=encodeURIComponent(store);
      const params=new URLSearchParams({store});
      const cart=validItems(read(localStorage,'cardap-demo-cart:'+encoded,[]));
      if(cart.length){
        const count=cart.reduce((sum,item)=>sum+item.quantity,0);itemCount+=count;
        const total=cart.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0);
        carts.append(createEntry(store,count+(count===1?' item':' itens')+' · '+money(total),'Continuar compra','cardap-carrinho.html?'+params));
      }
      const order=read(sessionStorage,'cardap-demo-order:'+encoded,null);
      if(order && typeof order.id==='string' && order.id.startsWith('DEMO-') && Number.isSafeInteger(order.total) && order.total>0 && validItems(order.items).length){
        orderCount++;
        orders.append(createEntry(store,order.id+' · '+money(order.total)+' · Simulação sem pagamento','Ver resumo','cardap-pedido-confirmado.html?'+params));
      }
    });
    document.querySelector('#cart-count').textContent=itemCount;
    document.querySelector('#order-count').textContent=orderCount;
    document.querySelector('#no-carts').hidden=itemCount>0;
    document.querySelector('#no-orders').hidden=orderCount>0;
  };
  document.querySelector('#demo-login').addEventListener('click',()=>{
    try{sessionStorage.setItem(userKey,JSON.stringify({id:'demo-customer',name:'Cliente de demonstração',email:'cliente@example.com',demo:true}));render();}catch{document.querySelector('#guest-status').textContent='Não foi possível iniciar a sessão neste navegador.';}
  });
  document.querySelector('#sign-out').addEventListener('click',()=>{
    try{sessionStorage.removeItem(userKey);document.querySelector('#profile-form').reset();document.querySelector('#profile-status').textContent='';render();document.querySelector('#account-status').textContent='Você saiu da sessão de demonstração.';document.querySelector('#demo-login').focus();}catch{document.querySelector('#account-status').textContent='Não foi possível encerrar a sessão. Tente novamente.';}
  });
  document.querySelector('#profile-form').addEventListener('submit',event=>{
    event.preventDefault();const user=getUser();if(!user){render();return;}
    const name=document.querySelector('#profile-name').value.trim();const email=document.querySelector('#profile-email').value.trim();
    if(name.length<2){document.querySelector('#profile-status').textContent='Informe um nome com pelo menos dois caracteres.';return;}
    if(!event.target.reportValidity())return;
    try{sessionStorage.setItem(userKey,JSON.stringify({...user,name,email}));render();document.querySelector('#profile-status').textContent='Perfil atualizado nesta sessão de demonstração.';}catch{document.querySelector('#profile-status').textContent='Não foi possível salvar o perfil.';}
  });
  window.addEventListener('pageshow',render);
  window.addEventListener('storage',render);
  render();
})();
