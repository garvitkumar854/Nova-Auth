function AuthShell({ children }) {
  return (
    <main className="page">
      <section className="register-card">
        <div className="card-badge" aria-hidden="true">✦</div>
        <p className="brand">Nova Auth</p>
        {children}
      </section>
    </main>
  )
}

export default AuthShell
